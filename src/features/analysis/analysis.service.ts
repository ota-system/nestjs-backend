import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Queue } from "bullmq";
import { Repository } from "typeorm";
import { ClassEntity } from "../../database/entities/class.entity";
import { StudentResultEntity } from "../../database/entities/student-result.entity";
import { TestEntity } from "../../database/entities/test.entity";
import { StudentClassGpaView } from "../../database/views/student-class-gpa.view";
import { TopicAvgScoreView } from "../../database/views/topic-avg-score.view";
import { REFRESH_VIEW_QUEUE } from "../../shared/constants/queue.constant";
import { AccessForbiddenException } from "../../shared/exception/access-forbidden.exception";

@Injectable()
export class AnalysisService {
	constructor(
		@InjectRepository(ClassEntity)
		private readonly classRepository: Repository<ClassEntity>,
		@InjectRepository(TestEntity)
		private readonly testRepository: Repository<TestEntity>,
		@InjectRepository(StudentResultEntity)
		private readonly studentResultRepository: Repository<StudentResultEntity>,
		@InjectRepository(StudentClassGpaView)
		private readonly studentClassGpaRepository: Repository<StudentClassGpaView>,
		@InjectRepository(TopicAvgScoreView)
		private readonly topicAvgScoreRepository: Repository<TopicAvgScoreView>,
		@InjectQueue(REFRESH_VIEW_QUEUE)
		private readonly refreshQueue: Queue,
	) {}

	async getClassDashboardStats(classId: string, teacherId: string) {
		const classroom = await this.classRepository.findOne({
			where: { id: classId, teacher: { id: teacherId } },
		});
		if (!classroom) {
			throw new AccessForbiddenException();
		}

		const tests = await this.testRepository.find({
			where: { class: { id: classId } },
			order: { createdAt: "DESC" },
		});

		const availableTests = tests.map((t) => ({
			id: t.id,
			name: t.testName,
			createdAt: t.createdAt,
		}));

		const [gpaDistribution] = await this.buildGpaDistribution(classId);
		const gpaAcrossTopics = await this.buildTopicAvgScores(classId);
		const classTopicAvgScore = this.buildClassTopicAvgScore(gpaAcrossTopics);

		return {
			className: classroom.name,
			gpaDistribution,
			gpaAcrossTopics,
			classTopicAvgScore,
			availableTests,
		};
	}

	async getTestDashboardStats(
		classId: string,
		teacherId: string,
		testId?: string,
	) {
		const isTeacher = await this.classRepository.exists({
			where: { id: classId, teacher: { id: teacherId } },
		});
		if (!isTeacher) {
			throw new AccessForbiddenException();
		}

		let selectedTest: TestEntity | null = null;
		if (testId) {
			selectedTest = await this.testRepository.findOne({
				where: { id: testId, class: { id: classId } },
			});
		} else {
			selectedTest = await this.testRepository.findOne({
				where: { class: { id: classId } },
				order: { createdAt: "DESC" },
			});
		}

		if (!selectedTest) {
			return {
				testId: null,
				testName: null,
				testGrades: [],
				studentScores: [],
			};
		}

		const { testGrades, studentScores } = await this.buildTestResults(
			selectedTest.id,
		);

		return {
			testId: selectedTest.id,
			testName: selectedTest.testName,
			testGrades,
			studentScores,
		};
	}

	private async buildGpaDistribution(
		classId: string,
	): Promise<[{ grade: number; count: number }[], number]> {
		const rows = await this.studentClassGpaRepository.find({
			where: { classId },
		});

		if (rows.length === 0) return [[], 0];

		const bucketMap = new Map<number, number>();
		let total = 0;

		for (const row of rows) {
			const gpa = Number(row.gpa);
			total += gpa;
			const bucket = Math.min(Math.floor(gpa), 10);
			bucketMap.set(bucket, (bucketMap.get(bucket) ?? 0) + 1);
		}

		const gpaDistribution = Array.from(bucketMap.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([grade, count]) => ({ grade, count }));

		const classAvgScore = Math.round((total / rows.length) * 100) / 100;

		return [gpaDistribution, classAvgScore];
	}

	private async buildTopicAvgScores(
		classId: string,
	): Promise<{ topic: string; avg: number }[]> {
		const rows = await this.topicAvgScoreRepository.find({
			where: { classId },
		});

		return rows.map((r) => ({
			topic: r.topicName,
			avg: Number(r.avgScore),
		}));
	}

	private buildClassTopicAvgScore(
		gpaAcrossTopics: { topic: string; avg: number }[],
	): number {
		return gpaAcrossTopics.length > 0
			? Math.round(
					(gpaAcrossTopics.reduce((sum, item) => sum + item.avg, 0) /
						gpaAcrossTopics.length) *
						100,
				) / 100
			: 0;
	}

	private async buildTestResults(testId: string): Promise<{
		testGrades: { grade: number; count: number }[];
		studentScores: { student: string; score: number }[];
	}> {
		const results = await this.studentResultRepository.find({
			where: { exam: { id: testId } },
			relations: ["student"],
		});

		if (results.length === 0) {
			return { testGrades: [], studentScores: [] };
		}

		const bucketMap = new Map<number, number>();
		for (const r of results) {
			const bucket = Math.min(Math.floor(r.score), 10);
			bucketMap.set(bucket, (bucketMap.get(bucket) ?? 0) + 1);
		}

		const testGrades = Array.from(bucketMap.entries())
			.sort((a, b) => a[0] - b[0])
			.map(([grade, count]) => ({ grade, count }));

		const studentScores = results
			.map((r) => ({ student: r.student.fullName, score: r.score }))
			.sort((a, b) => b.score - a.score);

		return { testGrades, studentScores };
	}

	async triggerRefreshGpaView(): Promise<void> {
		const VIEW_NAME = "vw_student_class_gpa";

		try {
			await this.refreshQueue.add(
				REFRESH_VIEW_QUEUE,
				{ viewName: VIEW_NAME },
				{
					jobId: `refresh-${VIEW_NAME}`,
					delay: 10000,
					removeOnComplete: true,
					removeOnFail: { age: 3600 },
				},
			);
		} catch (error) {
			Logger.error(
				`Failed to enqueue refresh view job: ${VIEW_NAME}`,
				error instanceof Error ? error.stack : String(error),
			);
		}
	}
}
