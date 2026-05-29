import { Request, Response } from 'express';
import { CqrsAnalyticsService } from '../services/cqrsService';

const service = new CqrsAnalyticsService();

export const courseAnalytics = async (req: Request, res: Response) => {
  const data = await service.getCourseDashboard(req.params.courseId);
  res.json(data);
};

export const courseStudentsAnalytics = async (req: Request, res: Response) => {
  const data = await service.getStudentProgress(req.params.courseId);
  res.json(data);
};
