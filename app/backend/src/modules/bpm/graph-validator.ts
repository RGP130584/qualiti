export class BpmGraphValidator {
  static validate(bpmnJson: any): { valid: boolean; error?: string } {
    if (!bpmnJson || !bpmnJson.nodes || !bpmnJson.edges) {
      return { valid: false, error: "Estrutura do fluxo BPMN inválida (nós ou arestas ausentes)" };
    }

    const nodes = bpmnJson.nodes as any[];
    const edges = bpmnJson.edges as any[];

    if (!Array.isArray(nodes) || !Array.isArray(edges)) {
      return { valid: false, error: "Nós ou arestas devem ser arrays válidos" };
    }

    // 1. Exatamente 1 nó de início (type === 'start')
    const startNodes = nodes.filter(n => n.type === 'start');
    if (startNodes.length !== 1) {
      return { 
        valid: false, 
        error: `O fluxo deve conter exatamente 1 nó de início. Encontrados: ${startNodes.length}` 
      };
    }
    const startNode = startNodes[0];

    // 2. Pelo menos 1 nó de fim (type === 'end')
    const endNodes = nodes.filter(n => n.type === 'end');
    if (endNodes.length < 1) {
      return { 
        valid: false, 
        error: `O fluxo deve conter pelo menos 1 nó de fim.` 
      };
    }

    // Construção das listas de adjacência (direta e reversa)
    const adj: Record<string, string[]> = {};
    const revAdj: Record<string, string[]> = {};
    const nodeIds = new Set<string>();

    for (const node of nodes) {
      if (!node.id) {
        return { valid: false, error: "Nó sem identificador id válido detectado" };
      }
      adj[node.id] = [];
      revAdj[node.id] = [];
      nodeIds.add(node.id);
    }

    for (const edge of edges) {
      if (!edge.from || !edge.to) {
        return { valid: false, error: "Aresta com conexões inválidas (from/to ausentes)" };
      }
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        return { 
          valid: false, 
          error: `Aresta inválida referenciando nós inexistentes: de "${edge.from}" para "${edge.to}"` 
        };
      }
      adj[edge.from].push(edge.to);
      revAdj[edge.to].push(edge.from);
    }

    // 3. Conectividade direta a partir do início (DFS)
    const visitedFromStart = new Set<string>();
    const dfsStart = (u: string) => {
      visitedFromStart.add(u);
      for (const v of adj[u] || []) {
        if (!visitedFromStart.has(v)) {
          dfsStart(v);
        }
      }
    };
    dfsStart(startNode.id);

    // Se algum nó não é alcançável a partir do início, temos nós órfãos
    for (const node of nodes) {
      if (!visitedFromStart.has(node.id)) {
        return { 
          valid: false, 
          error: `Nó órfão não alcançável a partir do nó de Início: "${node.label || node.id}"` 
        };
      }
    }

    // 4. Conectividade reversa até algum fim (DFS reverso)
    const visitedToEnd = new Set<string>();
    const dfsEnd = (u: string) => {
      visitedToEnd.add(u);
      for (const v of revAdj[u] || []) {
        if (!visitedToEnd.has(v)) {
          dfsEnd(v);
        }
      }
    };

    for (const endNode of endNodes) {
      dfsEnd(endNode.id);
    }

    // Se algum nó não consegue alcançar nenhum fim, temos um ciclo infinito ou beco sem saída
    for (const node of nodes) {
      if (!visitedToEnd.has(node.id)) {
        return { 
          valid: false, 
          error: `Nó não consegue alcançar nenhum nó de Fim (beco sem saída ou ciclo infinito): "${node.label || node.id}"` 
        };
      }
    }

    return { valid: true };
  }
}
