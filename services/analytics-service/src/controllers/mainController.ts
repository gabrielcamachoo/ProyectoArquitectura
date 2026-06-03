import { Response } from 'express';
import { CqrsAnalyticsService } from '../services/cqrsService';
import { AuthRequest } from '../middleware/auth';

const service = new CqrsAnalyticsService();

export const courseAnalytics = async (req: AuthRequest, res: Response) => {
  const data = await service.getCourseDashboard(req.params.courseId);
  res.json(data);
};

export const courseStudentsAnalytics = async (req: AuthRequest, res: Response) => {
  const data = await service.getStudentProgress(req.params.courseId);
  res.json(data.students);
};
