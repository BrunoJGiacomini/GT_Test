import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./Equipamentos.css";

function Equipamentos({ areaSelecionada, onLimparSelecao }) {
  const [equipamentos, setEquipamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [atualizandoId, setAtualizandoId] = useState(null);
  const [erroAtualizacao, setErroAtualizacao] = useState(null);

  useEffect(() => {
    async function carregarEquipamentos() {
      const { data, error } = await supabase.from("equipamentos").select(`
          *,
          areas_verdes (
            nome,
            tipo
          )
        `);

      if (error) {
        console.error("Erro ao carregar equipamentos:", error);
        setErro("Não foi possível carregar os equipamentos.");
      } else {
        setEquipamentos(data);
      }

      setCarregando(false);
    }

    carregarEquipamentos();
  }, []);

  async function alterarStatus(equipamento, novoStatus) {
    if (atualizandoId !== null) return;

    setAtualizandoId(equipamento.id);
    setErroAtualizacao(null);

    try {
      const { error } = await supabase
        .from("equipamentos")
        .update({ status: novoStatus })
        .eq("id", equipamento.id);

      if (error) {
        console.error("Erro ao atualizar equipamento:", error);
        setErroAtualizacao(
          "Não foi possível atualizar o equipamento. Tente novamente.",
        );
        return;
      }

      setEquipamentos((listaAtual) =>
        listaAtual.map((item) =>
          item.id === equipamento.id ? { ...item, status: novoStatus } : item,
        ),
      );
    } catch (error) {
      console.error("Erro inesperado:", error);
      setErroAtualizacao("Ocorreu um erro inesperado ao atualizar.");
    } finally {
      setAtualizandoId(null);
    }
  }

  // Define quais ações fazem sentido para cada status.
  function obterAcoes(equipamento) {
    switch (equipamento.status) {
      case "DISPONIVEL":
        return [
          {
            texto: "Colocar em uso",
            status: "EM_USO",
            classe: "action-primary",
          },
          {
            texto: "Manutenção",
            status: "MANUTENCAO",
            classe: "action-maintenance",
          },
          {
            texto: "Marcar quebrado",
            status: "QUEBRADO",
            classe: "action-danger",
          },
        ];

      case "EM_USO":
        return [
          {
            texto: "Liberar equipamento",
            status: "DISPONIVEL",
            classe: "action-success",
          },
          {
            texto: "Manutenção",
            status: "MANUTENCAO",
            classe: "action-maintenance",
          },
          {
            texto: "Marcar quebrado",
            status: "QUEBRADO",
            classe: "action-danger",
          },
        ];

      case "MANUTENCAO":
        return [
          {
            texto: "Finalizar manutenção",
            status: "DISPONIVEL",
            classe: "action-success",
          },
          {
            texto: "Marcar quebrado",
            status: "QUEBRADO",
            classe: "action-danger",
          },
        ];

      case "QUEBRADO":
        return [
          {
            texto: "Enviar para manutenção",
            status: "MANUTENCAO",
            classe: "action-maintenance",
          },
          {
            texto: "Confirmar reparo",
            status: "DISPONIVEL",
            classe: "action-success",
          },
        ];

      default:
        return [];
    }
  }

  const equipamentosFiltrados = areaSelecionada
    ? equipamentos.filter(
        (equipamento) =>
          String(equipamento.area_verde_id) === String(areaSelecionada.id),
      )
    : equipamentos;

  const disponiveis = equipamentosFiltrados.filter(
    (item) => item.status === "DISPONIVEL",
  ).length;

  const emUso = equipamentosFiltrados.filter(
    (item) => item.status === "EM_USO",
  ).length;

  const emManutencao = equipamentosFiltrados.filter(
    (item) => item.status === "MANUTENCAO",
  ).length;

  const quebrados = equipamentosFiltrados.filter(
    (item) => item.status === "QUEBRADO",
  ).length;

  function obterNomeStatus(status) {
    const nomes = {
      DISPONIVEL: "Disponível",
      EM_USO: "Em uso",
      MANUTENCAO: "Em manutenção",
      QUEBRADO: "Quebrado",
    };

    return nomes[status] ?? status;
  }

  if (carregando) {
    return (
      <section className="panel">
        <p className="feedback">Carregando equipamentos...</p>
      </section>
    );
  }

  if (erro) {
    return (
      <section className="panel">
        <p className="feedback error">{erro}</p>
      </section>
    );
  }

  return (
    <section className="panel equipment-panel">
      <div className="panel-heading">
        <div>
          <h2>Equipamentos</h2>
          <p>
            {areaSelecionada
              ? `Equipamentos da área: ${areaSelecionada.nome}`
              : "Selecione uma área no mapa para filtrar os equipamentos."}
          </p>
        </div>

        {areaSelecionada && (
          <button
            type="button"
            className="clear-area-button"
            onClick={onLimparSelecao}
          >
            Ver todos os equipamentos
          </button>
        )}

        <span className="equipment-total">
          {equipamentosFiltrados.length}{" "}
          {equipamentosFiltrados.length === 1 ? "item" : "itens"}
        </span>
      </div>

      <div className="equipment-summary">
        <div className="summary-item">
          <span className="summary-label">Total cadastrado</span>
          <strong>{equipamentosFiltrados.length}</strong>
        </div>

        <div className="summary-item">
          <span className="summary-label">Disponíveis</span>
          <strong className="summary-green">{disponiveis}</strong>
        </div>

        <div className="summary-item">
          <span className="summary-label">Em uso</span>
          <strong className="summary-blue">{emUso}</strong>
        </div>

        <div className="summary-item">
          <span className="summary-label">Em manutenção</span>
          <strong className="summary-orange">{emManutencao}</strong>
        </div>

        <div className="summary-item">
          <span className="summary-label">Quebrados</span>
          <strong className="summary-red">{quebrados}</strong>
        </div>
      </div>

      {erroAtualizacao && <p className="feedback error">{erroAtualizacao}</p>}

      {equipamentosFiltrados.length === 0 ? (
        <p className="empty-state">
          Nenhum equipamento cadastrado para esta seleção.
        </p>
      ) : (
        <div className="equipment-list">
          {equipamentosFiltrados.map((equipamento) => {
            const acoes = obterAcoes(equipamento);

            return (
              <article className="equipment-card" key={equipamento.id}>
                <div className="equipment-icon">
                  <span aria-hidden="true">⚙</span>
                </div>

                <div className="equipment-info">
                  <h3>{equipamento.nome}</h3>
                  <p>{equipamento.tipo}</p>

                  <span className="equipment-area">
                    Área: {equipamento.areas_verdes?.nome ?? "Não identificada"}
                  </span>
                </div>

                <span
                  className={`status-badge status-${equipamento.status.toLowerCase()}`}
                >
                  <span className="status-dot" />
                  {obterNomeStatus(equipamento.status)}
                </span>

                <div className="equipment-actions">
                  {acoes.map((acao) => (
                    <button
                      key={acao.status}
                      type="button"
                      className={`equipment-action ${acao.classe}`}
                      disabled={atualizandoId !== null}
                      onClick={() => alterarStatus(equipamento, acao.status)}
                    >
                      {atualizandoId === equipamento.id
                        ? "Atualizando..."
                        : acao.texto}
                    </button>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Equipamentos;
