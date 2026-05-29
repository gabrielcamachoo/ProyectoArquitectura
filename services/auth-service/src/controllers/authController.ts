import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  constructor(private auth: AuthService) {}

  register = async (req: Request, res: Response) => {
    try {
      const user = await this.auth.register(req.body);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { token, refreshToken } = await this.auth.login(req.body.email, req.body.password);
      res.json({ token, refreshToken });
    } catch {
      res.status(401).json({ error: 'invalid_credentials' });
    }
  };

  refresh = async (req: Request, res: Response) => {
    try {
      const data = await this.auth.refresh(req.body.refreshToken);
      res.json(data);
    } catch {
      res.status(401).json({ error: 'invalid_refresh' });
    }
  };

  logout = async (req: Request, res: Response) => {
    const header = req.header('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    await this.auth.logout(token);
    res.status(204).send();
  };

  exportData = async (req: Request, res: Response) => {
    try {
      const user = await this.auth.exportUserData(req.params.id);
      res.json(user);
    } catch {
      res.status(404).json({ error: 'not_found' });
    }
  };

  suppress = async (req: Request, res: Response) => {
    try {
      await this.auth.anonymizeUser(req.params.id);
      res.status(204).send();
    } catch {
      res.status(404).json({ error: 'not_found' });
    }
  };
}
