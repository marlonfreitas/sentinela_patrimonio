# Sentinela do Patrimônio 🛡️🏛️

O **Sentinela do Patrimônio** é uma plataforma de monitoramento, fiscalização e salvaguarda colaborativa dos patrimônios históricos, culturais, naturais e arqueológicos do Estado do Tocantins. Desenvolvida para o **CAOMA (Centro de Apoio Operacional do Meio Ambiente)** do **MPTO (Ministério Público do Estado do Tocantins)**, a aplicação conecta a colaboração cidadã à triagem e auditoria da equipe técnica.

---

## 🚀 Principais Funcionalidades

### 👥 1. Portal do Cidadão (Canal de Colaboração)
* **Denunciar Dano em Ativo:** Permite que cidadãos reportem danos (Vandalismo, Degradação Natural, Risco Estrutural) em bens já tombados/catalogados. Exige o envio de no mínimo 3 fotos comprobatórias do dano para validação técnica.
* **Sugerir Novo Patrimônio:** Permite sugerir a inclusão de um patrimônio ainda não catalogado pela base oficial. O cidadão fornece fotos, justificativa de tombamento e localização por GPS.
* **Acompanhamento de Protocolo:** Consulta em tempo real do andamento da denúncia ou sugestão através de um código de protocolo (`DEN-xxxx` ou `SUG-xxxx`). Denúncias anônimas utilizam uma chave de acesso segura (`KEY-xxxx`) para garantir a confidencialidade e rastreabilidade pelo próprio cidadão.

### 🏢 2. Gestão Interna (Área do MPTO)
* **Painel Central (Dashboard):** Métricas consolidadas sobre o status dos patrimônios, pendências de triagem, integridade dos ativos e painel analítico com Classificação Assistiva de IA.
* **Fila de Triagem de Denúncias:** Análise técnica de relatos recebidos. O analista pode:
  * *Arquivar:* Encerrar relatos improcedentes ou duplicados.
  * *Aprovar:* Vincular o relato a um ativo (novo ou existente), gerando uma **Ocorrência** de fiscalização aberta e agendando vistorias preventivas.
* **Fila de Triagem de Sugestões:** Avaliação de novos bens propostos. O técnico analisa o valor histórico/justificativa e, se aprovar, cadastra oficialmente o bem no mapa em formato de **Ponto** ou **Polígono** (sem suporte a linhas), definindo sua categoria.
* **Módulo de Ocorrências:** Controle de vistorias técnicas (laudo pericial, auditor responsável e agendamentos) e fluxo de encaminhamento institucional (notificação para a SECULT, IPHAN, MPTO ou Polícia Civil).

### 🗺️ 3. Mapas & Inventário
* **Mapa Interativo (Leaflet):** Exibe espacialmente todos os patrimônios catalogados e sugestões cidadãs aceitas. A cor do marcador (Verde/Amarelo/Vermelho) reflete o status de integridade em tempo real baseado nas ocorrências ativas.
* **Inventário Completo:** Busca textual e filtros avançados por Categoria (Material, Natural, Arqueológico), Status (Estável, Alerta, Crítico) e Origem (IPHAN, Estadual, Municipal ou Sugestão Cidadã).

---

## 🛠️ Stack Tecnológica

* **Core:** React 19 + TypeScript
* **Build Tool:** Vite
* **Estilização:** Tailwind CSS v4 + Vanilla CSS (Glassmorphism e Micro-animações)
* **Mapas:** Leaflet + React Leaflet
* **Gráficos & Análise:** Recharts
* **Banco de Dados & Autenticação:** Supabase Client (com mecanismo de *fallback* automático para base local mockada em caso de ausência de chaves de conexão)

---

## 📥 Instalação e Execução Local

### Pré-requisitos
* Node.js (v18+)
* NPM ou Yarn

### Passos para Configuração

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/marlonfreitas/sentinela_patrimonio.git
   cd sentinela_patrimonio
   ```

2. **Instalar Dependências:**
   ```bash
   npm install
   ```

3. **Configurar Variáveis de Ambiente:**
   Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase (caso queira persistência em nuvem):
   ```env
   VITE_SUPABASE_URL=https://sua-url-do-supabase.supabase.co
   VITE_SUPABASE_ANON_KEY=seu-token-anon-key-aqui
   ```
   *Nota: Caso o `.env` não seja configurado, a aplicação utilizará a base mockada em JSON de forma 100% offline e funcional.*

4. **Rodar em Modo de Desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a URL padrão indicada no console (geralmente [http://localhost:5173](http://localhost:5173)).

5. **Compilar para Produção (Build):**
   ```bash
   npm run build
   ```

---

## 📂 Estrutura do Código Principal

```text
src/
├── assets/         # Logotipos e imagens estáticas
├── components/     # Componentes compartilhados (TopAppBar, SideNavBar)
├── context/        # Estado global e sincronização (DataContext)
├── lib/            # Integração e cliente Supabase (supabaseClient)
├── pages/          # Páginas principais
│   ├── Login.tsx
│   ├── gestao_interna/  # Painéis técnicos (Dashboard, Occurrences, Triage, SuggestionsTriage)
│   └── portal_do_cidadao/ # Portal público (CitizenChannel, Inventory, Map)
└── types/          # Tipagens TypeScript estruturadas (Asset, TriageItem, Occurrence)
```
