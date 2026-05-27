import { AppError } from '@errors/AppError';
import { signInWithEmailAndPassword } from '@infrastructure/firebase/auth';
import { UsuarioRepository } from '@repositories/usuarioRepository';

export class AuthService {
  private readonly usuarioRepository = new UsuarioRepository();

  async login(email: string, senha: string) {
    const authResult = await signInWithEmailAndPassword(email, senha);
    const usuarioDoc = await this.usuarioRepository.findActiveRawById(authResult.uid);

    if (!usuarioDoc) {
      throw new AppError('Credenciais inválidas', 401);
    }

    const usuarioData = usuarioDoc.data()!;

    let ministerio: Record<string, unknown> | null = null;
    if (usuarioData.ministerioId) {
      ministerio = await this.usuarioRepository.findMinisterioById(usuarioData.ministerioId);
    }

    return {
      token: authResult.idToken,
      usuario: {
        id: authResult.uid,
        nome: usuarioData.nome,
        email: usuarioData.email,
        funcao: usuarioData.funcao,
        fotoUrl: usuarioData.fotoUrl ?? null,
        ministerio,
      },
    };
  }

  async me(userId: string) {
    const usuarioDoc = await this.usuarioRepository.findRawById(userId);

    if (!usuarioDoc.exists) {
      throw new AppError('Usuário não encontrado', 404);
    }

    const usuarioData = usuarioDoc.data()!;
    const usuario = {
      id: usuarioDoc.id,
      ...usuarioData,
    } as Record<string, unknown>;

    const [ministerio, supervisor] = await Promise.all([
      usuarioData.ministerioId
        ? this.usuarioRepository.findMinisterioById(usuarioData.ministerioId)
        : Promise.resolve(null),
      usuarioData.supervisorId
        ? this.usuarioRepository.findSupervisorBasicById(usuarioData.supervisorId)
        : Promise.resolve(null),
    ]);

    return { ...usuario, ministerio, supervisor };
  }

  logout() {
    return { message: 'Logout realizado com sucesso' };
  }
}
