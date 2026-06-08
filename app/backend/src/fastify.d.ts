import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: number;
      nome: string;
      email: string;
      role: string;
      departamento: string;
      unidade: string;
      suspended?: boolean;
      features_ativas?: string[];
    };
  }
}
