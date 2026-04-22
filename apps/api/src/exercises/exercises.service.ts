import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ErrorCode, ErrorMessage } from "@squademy/shared";

@Injectable()
export class ExercisesService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(exerciseId: string, userId: string) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!exercise) {
      throw new NotFoundException({
        ok: false,
        message: ErrorMessage[ErrorCode.EXERCISE_NOT_FOUND],
        code: ErrorCode.EXERCISE_NOT_FOUND,
      });
    }

    if (exercise.type === "group_challenge") {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId: exercise.groupId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new ForbiddenException({
          ok: false,
          message: ErrorMessage[ErrorCode.NOT_GROUP_MEMBER],
          code: ErrorCode.NOT_GROUP_MEMBER,
        });
      }
    }

    return {
      id: exercise.id,
      title: exercise.title,
      type: exercise.type,
      groupId: exercise.groupId,
      lessonId: exercise.lessonId,
      questions: exercise.questions.map((q) => ({
        id: q.id,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        audioUrl: q.audioUrl,
        ipa: q.ipa,
        order: q.order,
      })),
    };
  }

  async findSubmissions(exerciseId: string, userId: string) {
    const submissions = await this.prisma.exerciseSubmission.findMany({
      where: {
        exerciseId,
        userId,
      },
      orderBy: { submittedAt: "desc" },
      select: {
        id: true,
        score: true,
        correctCount: true,
        totalCount: true,
        timeTaken: true,
        submittedAt: true,
      },
    });

    return submissions;
  }

  async submit(
    exerciseId: string,
    userId: string,
    data: {
      answers: { questionId: string; answer: string | string[] }[];
      timeTaken: number;
      focusEvents?: { type: string; timestamp: string }[];
    },
  ) {
    const exercise = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: {
        questions: true,
      },
    });

    if (!exercise) {
      throw new NotFoundException({
        ok: false,
        message: ErrorMessage[ErrorCode.EXERCISE_NOT_FOUND],
        code: ErrorCode.EXERCISE_NOT_FOUND,
      });
    }

    const questionMap = new Map(exercise.questions.map((q) => [q.id, q]));

    const evaluatedAnswers = data.answers.map((answer) => {
      const question = questionMap.get(answer.questionId);
      if (!question) {
        return { questionId: answer.questionId, answer: answer.answer, isCorrect: false };
      }

      const isCorrect = this.evaluateAnswer(answer.answer, question.answers, question.type);
      return { questionId: answer.questionId, answer: answer.answer, isCorrect };
    });

    const correctCount = evaluatedAnswers.filter((a) => a.isCorrect).length;
    const totalCount = exercise.questions.length;
    const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

    const submission = await this.prisma.exerciseSubmission.create({
      data: {
        exerciseId,
        userId,
        answers: evaluatedAnswers,
        score,
        correctCount,
        totalCount,
        timeTaken: data.timeTaken,
        focusEvents: data.focusEvents || [],
      },
    });

    return {
      id: submission.id,
      score: submission.score,
      correctCount: submission.correctCount,
      totalCount: submission.totalCount,
      timeTaken: submission.timeTaken,
    };
  }

  private evaluateAnswer(
    userAnswer: string | string[],
    correctAnswers: unknown,
    questionType: string,
  ): boolean {
    if (questionType === "mcq") {
      const correct = correctAnswers as string;
      return userAnswer === correct;
    }

    if (questionType === "cloze" && Array.isArray(userAnswer) && Array.isArray(correctAnswers)) {
      const correctArray = correctAnswers as string[];
      if (userAnswer.length !== correctArray.length) return false;
      return userAnswer.every((ans, idx) => 
        ans.trim().toLowerCase() === correctArray[idx].trim().toLowerCase()
      );
    }

    const userStr = String(userAnswer).trim().toLowerCase();
    const correctStr = String(correctAnswers).trim().toLowerCase();
    return userStr === correctStr;
  }
}
