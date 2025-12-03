import { defineStore } from 'pinia'

export interface VFNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, any>
}
export interface VFEdge {
  id: string
  source: string
  target: string
  label?: string
  type?: string
}

export const useFlowStore = defineStore('flow', {
  state: () => ({
    nodes: [] as VFNode[],
    edges: [] as VFEdge[],
    selectedNodeId: null as string | null,
  }),
  getters: {
    selectedNode(state) {
      return state.nodes.find(n => n.id === state.selectedNodeId) || null
    },
  },
  actions: {
    addNode(node: Omit<VFNode, 'id'> & { id?: string }) {
      const id = node.id || `node_${Date.now().toString(36)}${Math.floor(Math.random()*1000)}`
      this.nodes.push({ ...node, id })
      return id
    },
    updateNode(nodeId: string, updates: Partial<VFNode>) {
      const i = this.nodes.findIndex(n => n.id === nodeId)
      if (i !== -1) this.nodes[i] = { ...this.nodes[i], ...updates }
    },
    setNodeData(nodeId: string, data: Record<string, any>) {
      const i = this.nodes.findIndex(n => n.id === nodeId)
      if (i !== -1) this.nodes[i] = { ...this.nodes[i], data: { ...this.nodes[i].data, ...data } }
    },
    connectNodes(source: string, target: string, label?: string) {
      const id = `edge_${source}_${target}`
      if (!this.edges.find(e => e.id === id)) this.edges.push({ id, source, target, label, type: 'straight' })
    },
    setSelection(id: string | null) { this.selectedNodeId = id },
    removeSelected() {
      if (!this.selectedNodeId) return
      const id = this.selectedNodeId
      this.nodes = this.nodes.filter(n => n.id !== id)
      this.edges = this.edges.filter(e => e.source !== id && e.target !== id)
      this.selectedNodeId = null
    }
  }
})





















