import { useEffect, useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { supabase } from "./supabaseClient";
import Equipamentos from "./Equipamentos";
import "./App.css";

function App() {
  const [areasVerdes, setAreasVerdes] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [areaSelecionada, setAreaSelecionada] = useState(null);

  useEffect(() => {
    async function carregarAreasVerdes() {
      const { data, error } = await supabase.rpc("listar_areas_verdes");

      if (error) {
        console.error("Erro ao carregar áreas:", error);
        setErro("Não foi possível carregar as áreas verdes.");
        setCarregando(false);
        return;
      }

      setAreasVerdes(data);
      setCarregando(false);
    }

    carregarAreasVerdes();
  }, []);

  function configurarArea(feature, layer) {
    const propriedades = feature.properties;

    layer.bindPopup(`
    <strong>${propriedades.nome}</strong><br />
    Tipo: ${propriedades.tipo}
  `);

    layer.on("click", () => {
      setAreaSelecionada({
        id: propriedades.id,
        nome: propriedades.nome,
        tipo: propriedades.tipo,
      });
    });
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="brand-icon">G</div>

          <div>
            <h1>GreenTwin Mini</h1>
            <p>Gestão inteligente de áreas verdes</p>
          </div>
        </div>

        <span className="header-badge">Protótipo</span>
      </header>

      <main className="dashboard">
        <section className="welcome">
          <div>
            <p className="eyebrow">PAINEL DE CONTROLE</p>
            <h2>Visão geral</h2>
            <p className="welcome-description">
              Acompanhe as áreas verdes e os equipamentos de manutenção.
            </p>
          </div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">Áreas verdes cadastradas</span>
            <strong>{areasVerdes?.features?.length ?? 0}</strong>
          </article>
        </section>

        <section className="panel map-panel">
          <div className="panel-heading">
            <div>
              <h2>Áreas verdes</h2>
              <p>Visualização geográfica das áreas cadastradas</p>
            </div>

            <span className="section-icon">⌖</span>
          </div>

          {carregando && <p className="feedback">Carregando áreas verdes...</p>}

          {erro && <p className="feedback error">{erro}</p>}

          <div className="map-container">
            <MapContainer
              center={[-23.083, -47.221]}
              zoom={15}
              scrollWheelZoom={true}
              className="leaflet-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {areasVerdes && (
                <GeoJSON
                  key={JSON.stringify(areasVerdes)}
                  data={areasVerdes}
                  onEachFeature={configurarArea}
                  style={(feature) => ({
                    color:
                      feature.properties.tipo === "Parque"
                        ? "#176b3a"
                        : "#65a30d",
                    fillColor:
                      feature.properties.tipo === "Parque"
                        ? "#22a05a"
                        : "#84cc16",
                    fillOpacity: 0.35,
                    weight: 2,
                  })}
                />
              )}
            </MapContainer>
          </div>

          <div className="map-legend">
            <span className="legend-item">
              <span className="legend-dot park-dot"></span>
              Parque
            </span>

            <span className="legend-item">
              <span className="legend-dot square-dot"></span>
              Praça / outras áreas
            </span>
          </div>
        </section>

        <Equipamentos
          areaSelecionada={areaSelecionada}
          onLimparSelecao={() => setAreaSelecionada(null)}
        />
      </main>

      <footer className="app-footer">
        GreenTwin Mini · Protótipo de gestão de áreas verdes
      </footer>
    </div>
  );
}

export default App;
