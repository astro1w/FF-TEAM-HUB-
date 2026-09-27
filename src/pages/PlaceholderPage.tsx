import EmptyState from '@/components/ui/EmptyState'

// Página temporária para rotas da Fase 1 cuja UI completa chega numa fase seguinte
// (ver secção "Ordem de execução" do plano do produto). Mantém a navegação real
// e honesta em vez de um link morto.
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">{title}</h1>
      <EmptyState title="Esta secção chega numa próxima fase." description="A Fase 1 cobre autenticação, perfil e onboarding." />
    </div>
  )
}
