import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendationService';

export class RecommendationController {
  constructor(private service: RecommendationService) {}

  getByStudent = async (req: Request, res: Response) => {
    const data = await this.service.getStudentRecommendations(req.params.studentId);
    if (this.service.isCircuitOpen()) {
      return res.status(503).json({
        items: data,
        circuitOpen: true,
        message: 'Motor adaptivo en modo fallback — recomendaciones genéricas'
      });
    }
    return res.json(data);
  };

  getMetrics = (_req: Request, res: Response) => {
    return res.json({
      consumer: this.service.getMetrics(),
      circuitOpen: this.service.isCircuitOpen()
    });
  };
}
