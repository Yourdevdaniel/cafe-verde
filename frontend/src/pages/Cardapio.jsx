import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, dinheiro, TOTAL_MESAS } from "../api.js";
import { useToast } from "../App.jsx";

const lerCarrinho = () => JSON.parse(localStorage.getItem("carrinho") || "{}");
const lerFavoritos = () => JSON.parse(localStorage.getItem("favoritos") || "[]");

const ICONES = {
  "Cafés": "☕",
  "Bebidas Geladas": "🧊",
  "Salgados": "🥐",
  "Doces": "🍰",
  "Combos": "🎁",
};
const icone = (cat) => ICONES[cat] || "🍽️";
const slug = (cat) => "cat-" + cat.toLowerCase().replace(/\s+/g, "-");
const normalizar = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function Estrelas({ produto, aoAvaliar }) {
  return (
    <button className="estrelas" onClick={() => aoAvaliar(produto)}
      title="Avaliar este produto">
      {produto.nota_media != null ? (
        <>
          ★ {produto.nota_media.toFixed(1).replace(".", ",")}
          <span className="num-aval">({produto.num_avaliacoes})</span>
        </>
      ) : (
        <span className="num-aval">☆ Avalie primeiro</span>
      )}
    </button>
  );
}

function CardProduto({ produto, indice, aoAdicionar, favorito, aoFavoritar, aoAvaliar }) {
  const [fotoQuebrada, setFotoQuebrada] = useState(false);
  return (
    <article className="card-prod" style={{ "--i": indice }}>
      <div className="card-foto">
        {produto.imagem && !fotoQuebrada ? (
          <img src={produto.imagem} alt={produto.nome} loading="lazy"
            onError={() => setFotoQuebrada(true)} />
        ) : (
          <span className="emoji-fallback">{produto.emoji}</span>
        )}
        {produto.destaque && <span className="selo-destaque">🔥 Destaque</span>}
        <button
          className={`btn-fav ${favorito ? "favoritado" : ""}`}
          aria-label={favorito ? `Tirar ${produto.nome} dos favoritos` : `Favoritar ${produto.nome}`}
          onClick={() => aoFavoritar(produto)}
        >
          {favorito ? "❤️" : "🤍"}
        </button>
        <span className="card-preco">{dinheiro(produto.preco)}</span>
      </div>
      <div className="card-info">
        <div className="linha-titulo">
          <h3>{produto.nome}</h3>
          <Estrelas produto={produto} aoAvaliar={aoAvaliar} />
        </div>
        <p className="desc">{produto.descricao}</p>
        <button className="btn-add" onClick={() => aoAdicionar(produto)}>
          Adicionar +
        </button>
      </div>
    </article>
  );
}

function Carrossel({ id, titulo, produtos, renderCard }) {
  const trilho = useRef(null);
  const rolar = (dir) =>
    trilho.current.scrollBy({ left: dir * trilho.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="secao-cat" id={id}>
      <div className="cabecalho">
        <h2>{titulo}</h2>
        <div className="setas">
          <button className="seta" aria-label={`Voltar em ${titulo}`} onClick={() => rolar(-1)}>←</button>
          <button className="seta" aria-label={`Avançar em ${titulo}`} onClick={() => rolar(1)}>→</button>
        </div>
      </div>
      <div className="carrossel" ref={trilho}>
        {produtos.map((p, i) => renderCard(p, i))}
      </div>
    </section>
  );
}

export default function Cardapio() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [secaoAtiva, setSecaoAtiva] = useState("");
  const [carrinho, setCarrinho] = useState(lerCarrinho); // id -> qtd
  const [favoritos, setFavoritos] = useState(lerFavoritos); // [id]
  const [mesa, setMesa] = useState(localStorage.getItem("mesa") || "");
  const [modal, setModal] = useState(null); // "carrinho" | "mesa" | null
  const [avaliando, setAvaliando] = useState(null); // produto sendo avaliado
  const [enviando, setEnviando] = useState(false);
  const toast = useToast();
  const navegar = useNavigate();

  const carregar = () =>
    api("/produtos/").then(setProdutos).catch(() => toast("Erro ao carregar o cardápio"));
  useEffect(() => { carregar(); }, []);

  useEffect(() => {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
  }, [carrinho]);
  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  // produto do dia: gira entre os destaques conforme a data
  const produtoDoDia = useMemo(() => {
    const destaques = produtos.filter((p) => p.destaque);
    if (!destaques.length) return null;
    const dia = Math.floor(Date.now() / 86400000);
    return destaques[dia % destaques.length];
  }, [produtos]);

  // seções: destaques, em alta, favoritos, depois categorias
  const secoes = useMemo(() => {
    const lista = [];
    const destaques = produtos.filter((p) => p.destaque);
    if (destaques.length)
      lista.push({ id: "destaques", rotulo: "Destaques", emoji: "🔥", titulo: "🔥 Destaques da casa", produtos: destaques });
    const emAlta = produtos
      .filter((p) => p.vendidos_semana > 0)
      .sort((a, b) => b.vendidos_semana - a.vendidos_semana)
      .slice(0, 8);
    if (emAlta.length)
      lista.push({ id: "em-alta", rotulo: "Em alta", emoji: "📈", titulo: "📈 Em alta agora", produtos: emAlta });
    const favs = produtos.filter((p) => favoritos.includes(p.id));
    if (favs.length)
      lista.push({ id: "favoritos", rotulo: "Favoritos", emoji: "❤️", titulo: "❤️ Seus favoritos", produtos: favs });
    for (const cat of [...new Set(produtos.map((p) => p.categoria))]) {
      lista.push({
        id: slug(cat),
        rotulo: cat,
        emoji: icone(cat),
        titulo: `${icone(cat)} ${cat}`,
        produtos: produtos.filter((p) => p.categoria === cat),
      });
    }
    return lista;
  }, [produtos, favoritos]);

  // chip ativo acompanha o scroll
  useEffect(() => {
    if (busca) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setSecaoAtiva(e.target.id);
      },
      { rootMargin: "-25% 0px -65% 0px" }
    );
    document.querySelectorAll(".secao-cat").forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, [secoes, busca]);

  function irPara(id) {
    setBusca("");
    setSecaoAtiva(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const porId = useMemo(() => Object.fromEntries(produtos.map((p) => [p.id, p])), [produtos]);
  const qtdTotal = Object.values(carrinho).reduce((a, b) => a + b, 0);
  const total = Object.entries(carrinho).reduce(
    (soma, [id, qtd]) => soma + (porId[id]?.preco || 0) * qtd,
    0
  );

  function mudarQtd(id, delta) {
    setCarrinho((c) => {
      const nova = { ...c, [id]: (c[id] || 0) + delta };
      if (nova[id] <= 0) delete nova[id];
      return nova;
    });
  }

  function adicionar(p) {
    mudarQtd(p.id, 1);
    toast(`${p.nome} adicionado!`);
  }

  function alternarFavorito(p) {
    setFavoritos((f) => {
      const tem = f.includes(p.id);
      toast(tem ? `${p.nome} saiu dos favoritos` : `${p.nome} favoritado! ❤️`);
      return tem ? f.filter((id) => id !== p.id) : [...f, p.id];
    });
  }

  async function enviarAvaliacao(nota) {
    const p = avaliando;
    setAvaliando(null);
    try {
      await api(`/produtos/${p.id}/avaliar/`, { method: "POST", body: { nota } });
      toast("Obrigado pela avaliação! ⭐");
      carregar();
    } catch (e) {
      toast(e.message);
    }
  }

  function escolherMesa(n) {
    setMesa(String(n));
    localStorage.setItem("mesa", n);
    setModal(null);
    toast(`Mesa ${n} selecionada!`);
  }

  async function finalizar() {
    setEnviando(true);
    try {
      const pedido = await api("/pedidos/", {
        method: "POST",
        body: {
          mesa: Number(mesa),
          itens: Object.entries(carrinho).map(([id, qtd]) => ({
            produto: Number(id),
            quantidade: qtd,
          })),
        },
      });
      const meus = JSON.parse(localStorage.getItem("meusPedidos") || "[]");
      localStorage.setItem("meusPedidos", JSON.stringify([...meus, pedido.id]));
      setCarrinho({});
      setModal(null);
      toast("Pedido enviado pra cozinha! 🎉");
      navegar("/meus-pedidos");
    } catch (e) {
      toast(e.message);
    } finally {
      setEnviando(false);
    }
  }

  const renderCard = (p, i) => (
    <CardProduto
      key={p.id}
      produto={p}
      indice={i}
      aoAdicionar={adicionar}
      favorito={favoritos.includes(p.id)}
      aoFavoritar={alternarFavorito}
      aoAvaliar={setAvaliando}
    />
  );

  const resultados = busca
    ? produtos.filter((p) =>
        normalizar(`${p.nome} ${p.descricao} ${p.categoria}`).includes(normalizar(busca))
      )
    : [];

  return (
    <>
      <section className="hero">
        <img className="fundo" src="/img/espresso.jpg" alt="" />
        <div className="hero-conteudo">
          <span className="hero-eyebrow">★ 4,9 · Torra artesanal · Aberto agora</span>
          <h1>O seu café sai da mesa, sem fila.</h1>
          <p>Escolha a mesa, monte o pedido e a cozinha recebe na hora. Grãos selecionados e o melhor pão de queijo da cidade.</p>
          <button className="btn-mesa" onClick={() => setModal("mesa")}>
            🪑 {mesa ? `Mesa ${mesa} · trocar` : "Escolher minha mesa"}
          </button>
        </div>
      </section>

      <div className="nav-cardapio">
        <div className="chip-busca">
          <span aria-hidden="true">🔍</span>
          <input
            type="search"
            placeholder="Buscar no cardápio"
            aria-label="Buscar no cardápio"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca && (
            <button className="limpar" aria-label="Limpar busca" onClick={() => setBusca("")}>✕</button>
          )}
        </div>
        {secoes.map((s) => (
          <button
            key={s.id}
            className={`chip ${!busca && secaoAtiva === s.id ? "ativa" : ""}`}
            onClick={() => irPara(s.id)}
          >
            <span aria-hidden="true">{s.emoji}</span> {s.rotulo}
            <span className="cont">{s.produtos.length}</span>
          </button>
        ))}
      </div>

      {busca ? (
        <section className="secao-cat">
          <div className="cabecalho">
            <h2>🔍 Resultados pra “{busca}” ({resultados.length})</h2>
          </div>
          {resultados.length ? (
            <div className="grade">{resultados.map(renderCard)}</div>
          ) : (
            <div className="vazio">
              <div className="icone">🤔</div>
              <p>Nada com esse nome por aqui.<br />Tenta “café”, “bolo”, “combo”…</p>
            </div>
          )}
        </section>
      ) : (
        <>
          {produtoDoDia && (
            <section className="banner-dia">
              {produtoDoDia.imagem ? (
                <img src={produtoDoDia.imagem} alt="" />
              ) : (
                <div className="banner-dia-emoji">{produtoDoDia.emoji}</div>
              )}
              <div className="banner-dia-info">
                <span className="hero-eyebrow">⭐ Produto do dia</span>
                <h2>{produtoDoDia.nome}</h2>
                <p>{produtoDoDia.descricao}</p>
                <div className="banner-dia-acoes">
                  <strong>{dinheiro(produtoDoDia.preco)}</strong>
                  <button className="btn-add" onClick={() => adicionar(produtoDoDia)}>
                    Adicionar +
                  </button>
                </div>
              </div>
            </section>
          )}
          {secoes.map((s) => (
            <Carrossel key={s.id} id={s.id} titulo={s.titulo} produtos={s.produtos} renderCard={renderCard} />
          ))}
        </>
      )}

      {qtdTotal > 0 && (
        <button className="barra-carrinho" onClick={() => setModal("carrinho")}>
          <span>
            <span className="qtd">{qtdTotal}</span> Ver carrinho
          </span>
          <strong>{dinheiro(total)}</strong>
        </button>
      )}

      {avaliando && (
        <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && setAvaliando(null)}>
          <div className="modal">
            <h2>⭐ Avaliar {avaliando.nome}</h2>
            <p style={{ color: "var(--marrom-claro)", marginBottom: 16 }}>
              Toque na quantidade de estrelas que esse item merece:
            </p>
            <div className="escolher-nota">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                  onClick={() => enviarAvaliacao(n)}>
                  {"★".repeat(n)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modal === "carrinho" && (
        <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h2>🛒 Seu pedido</h2>
            {Object.entries(carrinho).map(([id, qtd]) => {
              const p = porId[id];
              if (!p) return null;
              return (
                <div className="item-carrinho" key={id}>
                  {p.imagem ? (
                    <img className="mini-foto" src={p.imagem} alt="" />
                  ) : (
                    <span className="emoji">{p.emoji}</span>
                  )}
                  <span className="nome">
                    {p.nome}
                    <small>{dinheiro(p.preco * qtd)}</small>
                  </span>
                  <div className="controle-qtd">
                    <button aria-label={`Tirar um ${p.nome}`} onClick={() => mudarQtd(p.id, -1)}>−</button>
                    <span>{qtd}</span>
                    <button aria-label={`Adicionar mais um ${p.nome}`} onClick={() => mudarQtd(p.id, 1)}>+</button>
                  </div>
                </div>
              );
            })}
            <div className="total-linha">
              <span>Total</span>
              <span>{dinheiro(total)}</span>
            </div>
            <button className="btn-primario" disabled={!mesa || enviando} onClick={finalizar}>
              {mesa ? `Fazer pedido · Mesa ${mesa}` : "Escolha uma mesa primeiro"}
            </button>
            {!mesa && (
              <button className="btn-primario" style={{ background: "var(--marrom)" }}
                onClick={() => setModal("mesa")}>
                🪑 Escolher mesa
              </button>
            )}
          </div>
        </div>
      )}

      {modal === "mesa" && (
        <div className="modal-fundo" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <h2>🪑 Escolha sua mesa</h2>
            <div className="grade-mesas">
              {Array.from({ length: TOTAL_MESAS }, (_, i) => i + 1).map((n) => (
                <button key={n} className={String(n) === mesa ? "escolhida" : ""} onClick={() => escolherMesa(n)}>
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
