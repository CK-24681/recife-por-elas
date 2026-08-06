import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import type { Pool } from 'pg';
import { validarToken } from '../auth';
import { ChatbotIndisponivelError } from './openai';
import { processarChatbot, processarPlanoCarreira } from './service';

interface ReqComUsuario extends Request {
  usuarioId?: string;
}

function usuarioDoToken(req: Request): string | null {
  const header = req.headers.authorization || '';
  return validarToken(header.startsWith('Bearer ') ? header.slice(7) : '');
}

const limite = rateLimit({
  windowMs: Number(process.env.CHATBOT_RATE_WINDOW_MS || 15 * 60_000),
  max: Number(process.env.CHATBOT_RATE_MAX || 30),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { erro: 'Muitas mensagens. Tente novamente em alguns minutos.' },
});

export function registrarRotasChatbot(app: Express, pool: Pool | null): void {
  app.post('/api/chatbot', limite, async (req: ReqComUsuario, res: Response) => {
    const usuarioId = usuarioDoToken(req);
    req.usuarioId = usuarioId || undefined;
    try {
      res.json(await processarChatbot(req.body, pool, usuarioId));
    } catch (erro) {
      if (erro instanceof ChatbotIndisponivelError) {
        res.status(503).json({ erro: 'O assistente está temporariamente indisponível.' });
        return;
      }
      console.error('chatbot', erro instanceof Error ? erro.name : 'erro');
      res.status(400).json({ erro: erro instanceof Error ? erro.message : 'mensagem invalida' });
    }
  });

  app.post('/api/plano-carreira/gerar', limite, async (req: ReqComUsuario, res: Response) => {
    const usuarioId = usuarioDoToken(req);
    if (!usuarioId) {
      res.status(401).json({ erro: 'não autenticado' });
      return;
    }
    try {
      res.json(await processarPlanoCarreira(req.body, pool, usuarioId));
    } catch (erro) {
      console.error('plano carreira', erro instanceof Error ? erro.name : 'erro');
      res.status(503).json({ erro: 'Não foi possível gerar o plano agora.' });
    }
  });
}
