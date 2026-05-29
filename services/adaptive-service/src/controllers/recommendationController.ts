import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendationService';

export class RecommendationController {
  constructor(private service: RecommendationService) {}

  getByStudent = async (req: Request, res: Response) => {
    const data = await this.service.getStudentRecommendations(req.params.studentId);
    if (!data) return res.status(404).json({ error: 'not_found' });
    return res.json(data);
  };
}
