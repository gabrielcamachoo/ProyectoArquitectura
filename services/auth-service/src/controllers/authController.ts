import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export class AuthController {
  constructor(private auth: AuthService) {}

  register = async (req: Request, res: Response) => {
    try {
      // Accept both the internal contract and the demo script contract
      // Internal: fullName, institutionalEmail
      // Demo: name, email, consent_accepted
      const fullName = req.body.fullName ?? req.body.name;
      const institutionalEmail = req.body.institutionalEmail ?? req.body.email;
      const consentAccepted = req.body.consent_accepted ?? req.body.consentAccepted;

      if (consentAccepted === false) {
        return res.status(400).json({ error: 'consent_required' });
      }

      const result = await this.auth.register({
        fullName,
        institutionalEmail,
        password: req.body.password,
        role: req.body.role || 'student'
      });
      res.status(201).json(result);
    } catch (error) {
      const message = (error as Error).message;
      res.status(400).json({ error: message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await this.auth.login(
        req.body.institutionalEmail ?? req.body.email,
        req.body.password
      );
      res.status(200).json(result);
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'user_inactive') {
        return res.status(403).json({ error: 'user_inactive' });
      }
      res.status(401).json({ error: 'invalid_credentials' });
    }
  };

  refresh = async (req: Request, res: Response) => {
    try {
      const result = await this.auth.refresh(req.body.refreshToken);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ error: 'invalid_refresh' });
    }
  };

  logout = async (req: Request, res: Response) => {
    try {
      const header = req.header('authorization') || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : '';
      await this.auth.logout(token);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'logout_failed' });
    }
  };

  getCurrentUser = async (req: Request, res: Response) => {
    try {
      const context = req as Request & { userId?: string };
      if (!context.userId) {
        return res.status(401).json({ error: 'unauthorized' });
      }

      res.status(200).json({ userId: context.userId });
    } catch (error) {
      res.status(500).json({ error: 'error_getting_user' });
    }
  };

  exportData = async (req: Request, res: Response) => {
    try {
      const context = req as Request & { userId?: string; role?: string };
      const userId = req.params.userId;

      if (context.userId !== userId && context.role !== 'admin') {
        return res.status(403).json({ error: 'forbidden' });
      }

      const data = await this.auth.exportUserData(userId);
      res.status(200).json(data);
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'not_found') {
        return res.status(404).json({ error: 'user_not_found' });
      }
      res.status(500).json({ error: 'export_failed' });
    }
  };

  deleteUser = async (req: Request, res: Response) => {
    try {
      const context = req as Request & { userId?: string; role?: string };
      const userId = req.params.userId;

      if (context.userId !== userId && context.role !== 'admin') {
        return res.status(403).json({ error: 'forbidden' });
      }

      await this.auth.deleteUserData(userId);
      res.status(204).send();
    } catch (error) {
      const message = (error as Error).message;
      if (message === 'not_found') {
        return res.status(404).json({ error: 'user_not_found' });
      }
      res.status(500).json({ error: 'deletion_failed' });
    }
  };

  listUsers = async (req: Request, res: Response) => {
    try {
      const context = req as Request & { role?: string };
      if (context.role !== 'admin') {
        return res.status(403).json({ error: 'forbidden' });
      }

      const users = await this.auth.listUsers();
      res.status(200).json({ users });
    } catch (error) {
      res.status(500).json({ error: 'list_failed' });
    }
  };
}
