"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { translations, Language } from "@/lib/translations";

type ProductSize = {
  id: number;
  size: string;
  quantity: number;
  sort_order: number;
};

type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
retail_price: number | null;
image_url: string | null;
  category: string | null;
  tags: string[] | null;
  notes: string | null;
  product_sizes: ProductSize[];
};

const TAG_LABELS = {
  en: {
    ready_to_ship: "Ready to Ship",
    new: "New",
    last_unit: "Last Unit",
    promotion: "Promotion",
  },
  pt: {
    ready_to_ship: "Pronto para envio",
    new: "Novo",
    last_unit: "Última unidade",
    promotion: "Promoção",
  },
};

export default function Home() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [pesquisa, setPesquisa] = useState("");
  const [categoria, setCategoria] = useState("sneakers");
  const [ordenacao, setOrdenacao] = useState("recentes");
  const [language, setLanguage] = useState<Language>("en");
  const [carregando, setCarregando] = useState(true);

  // =========================
  // IDIOMA
  // =========================

  useEffect(() => {
    const idiomaGuardado =
      localStorage.getItem("language");

    if (
      idiomaGuardado === "en" ||
      idiomaGuardado === "pt"
    ) {
      setLanguage(idiomaGuardado);
    }

    function atualizarIdioma() {
      const idioma =
        localStorage.getItem("language");

      if (
        idioma === "en" ||
        idioma === "pt"
      ) {
        setLanguage(idioma);
      }
    }

    window.addEventListener(
      "languageChanged",
      atualizarIdioma
    );

    return () => {
      window.removeEventListener(
        "languageChanged",
        atualizarIdioma
      );
    };
  }, []);

  const t = translations[language];

  // =========================
  // CARREGAR PRODUTOS
  // =========================

  useEffect(() => {
    async function carregarProdutos() {
      setCarregando(true);

      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_sizes (
            id,
            size,
            quantity,
            sort_order
          )
        `)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Erro ao carregar produtos:",
          error
        );

        setCarregando(false);
        return;
      }

      setProdutos(
        (data || []) as Product[]
      );

      setCarregando(false);
    }

    carregarProdutos();
  }, []);

  // =========================
  // FILTROS
  // =========================

  const produtosFiltrados = useMemo(() => {
  const pesquisaNormalizada =
    pesquisa.trim().toLowerCase();

  const lista = produtos.filter((produto) => {
    const correspondeCategoria =
      categoria === "all" ||
      produto.category === categoria;

    const correspondePesquisa =
      !pesquisaNormalizada ||
      produto.name
        .toLowerCase()
        .includes(pesquisaNormalizada) ||
      produto.sku
        .toLowerCase()
        .includes(pesquisaNormalizada);

    return correspondeCategoria && correspondePesquisa;
  });

  return [...lista].sort((a, b) => {
    if (ordenacao === "preco-menor") {
      return Number(a.price) - Number(b.price);
    }

    if (ordenacao === "preco-maior") {
      return Number(b.price) - Number(a.price);
    }

    if (ordenacao === "antigos") {
      return a.id - b.id;
    }

    return b.id - a.id;
  });
}, [produtos, pesquisa, categoria, ordenacao]);

  // =========================
  // STOCK TOTAL
  // =========================

  function stockTotal(produto: Product) {
    return (produto.product_sizes || []).reduce(
      (total, tamanho) =>
        total + Number(tamanho.quantity || 0),
      0
    );
  }

  // =========================
  // TAG
  // =========================

  function nomeTag(tag: string) {
    return (
      TAG_LABELS[language][
        tag as keyof typeof TAG_LABELS.en
      ] || tag
    );
  }

  // =========================
  // CATEGORIA
  // =========================

  function nomeCategoria(
    categoriaProduto: string | null
  ) {
    if (categoriaProduto === "sneakers") {
      return t.sneakers;
    }

    if (categoriaProduto === "vestuario") {
      return t.clothing;
    }

    if (categoriaProduto === "acessorios") {
      return t.accessories;
    }

    return "";
  }

  return (
    <main className="min-h-screen bg-[#f6f6f6] text-black">

      {/* HEADER */}

      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">

          <div className="h-20 flex items-center justify-between">

            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-[0.18em]">
                {t.inventory}
              </h1>

              <p className="text-[10px] sm:text-xs text-gray-400 tracking-[0.2em] mt-1">
                {t.stockCatalog}
              </p>
            </div>

            <LanguageSwitcher />

          </div>

        </div>
      </header>

      {/* CONTEÚDO */}

      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-8">

        {/* PESQUISA + ORDENAÇÃO */}

<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

  <div className="flex flex-col sm:flex-row gap-3 w-full lg:max-w-3xl">

    <input
      type="text"
      value={pesquisa}
      onChange={(e) => setPesquisa(e.target.value)}
      placeholder={t.search}
      className="flex-1 bg-white border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-black transition"
    />

    <select
      value={ordenacao}
      onChange={(e) => setOrdenacao(e.target.value)}
      className="bg-white border border-gray-200 rounded-2xl px-5 py-4 text-sm outline-none cursor-pointer sm:w-56"
    >
      <option value="recentes">
        {language === "en"
          ? "Newest → Oldest"
          : "Mais recente → Mais antigo"}
      </option>

      <option value="antigos">
        {language === "en"
          ? "Oldest → Newest"
          : "Mais antigo → Mais recente"}
      </option>

      <option value="preco-menor">
        {language === "en"
          ? "Price: Low → High"
          : "Preço: Menor → Maior"}
      </option>

      <option value="preco-maior">
        {language === "en"
          ? "Price: High → Low"
          : "Preço: Maior → Menor"}
      </option>
    </select>

  </div>

  <div className="text-sm text-gray-400">
    {produtosFiltrados.length}{" "}
    {language === "en" ? "products" : "produtos"}
  </div>

</div>

        {/* CATEGORIAS */}

<div className="flex flex-wrap gap-2 mt-6">

  <button
    type="button"
    onClick={() => setCategoria("sneakers")}
    className={
      categoria === "sneakers"
        ? "bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium"
        : "bg-white border border-gray-200 px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:border-gray-400"
    }
  >
    {t.sneakers}
  </button>

  <button
    type="button"
    onClick={() => setCategoria("vestuario")}
    className={
      categoria === "vestuario"
        ? "bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium"
        : "bg-white border border-gray-200 px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:border-gray-400"
    }
  >
    {t.clothing}
  </button>

  <button
    type="button"
    onClick={() => setCategoria("acessorios")}
    className={
      categoria === "acessorios"
        ? "bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium"
        : "bg-white border border-gray-200 px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:border-gray-400"
    }
  >
    {t.accessories}
  </button>

  <button
    type="button"
    onClick={() => setCategoria("all")}
    className={
      categoria === "all"
        ? "bg-black text-white px-5 py-2.5 rounded-full text-sm font-medium"
        : "bg-white border border-gray-200 px-5 py-2.5 rounded-full text-sm font-medium text-gray-600 hover:border-gray-400"
    }
  >
    {language === "en" ? "All" : "Todos"}
  </button>

</div>

      </section>

      {/* PRODUTOS */}

      <section className="max-w-7xl mx-auto px-6 lg:px-8 pb-12">

        {carregando ? (
          <div className="py-20 text-center text-gray-400">
            {t.loading}
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl py-20 text-center text-gray-400">
            {t.noProducts}
          </div>
        ) : (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {produtosFiltrados.map(
              (produto) => {

                const stock =
                  stockTotal(produto);

                const tamanhos =
                  [...(produto.product_sizes || [])]
                    .sort(
                      (a, b) =>
                        a.sort_order -
                        b.sort_order
                    );

                return (
                  <article
                    key={produto.id}
className="bg-white rounded-[28px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.13)] hover:-translate-y-1 transition-all duration-300 flex flex-col"                  >

                    {/* IMAGEM */}

<div className="h-56 bg-[#fafafa] flex items-center justify-center p-5 relative m-3 mb-0 rounded-[22px]">
                      <img
                        src={
                          produto.image_url ||
                          "/products/air-force-white.png"
                        }
                        alt={produto.name}
                        className="w-full h-full object-contain transition-transform duration-300 hover:scale-[1.04]"
                      />

                      {produto.category && (
                        <span className="absolute top-4 left-4 bg-white/90 backdrop-blur border border-gray-200 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wide">
                          {nomeCategoria(
                            produto.category
                          )}
                        </span>
                      )}

                    </div>

                    {/* INFORMAÇÃO */}

<div className="px-6 pt-4 pb-5 flex flex-col flex-1">
                     <p className="text-xs text-gray-400 font-medium tracking-wide mb-2">
                        {produto.sku}
                      </p>

                     <h2 className="text-[19px] font-bold leading-snug tracking-[-0.01em]">
                        {produto.name}
                      </h2>

                      {/* TAGS */}

                      {produto.tags &&
                        produto.tags.length >
                          0 && (
                          <div className="flex flex-wrap gap-2 mt-4">

                            {produto.tags.map(
                              (tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] font-semibold uppercase tracking-wide bg-gray-100 px-3 py-1.5 rounded-full"
                                >
                                  {nomeTag(tag)}
                                </span>
                              )
                            )}

                          </div>
                        )}

                      {/* TAMANHOS */}

                      {tamanhos.length >
                        0 && (
                        <div className="mt-4">

                          <p className="text-xs text-gray-400 mb-3">
                            {t.sizesAvailable}
                          </p>

                          <div className="flex flex-wrap gap-2">

                            {tamanhos.map(
                              (tamanho) => (
                                <span
                                  key={
                                    tamanho.id
                                  }
                                  className="bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm font-medium"
                                >
                                  {tamanho.size}


{Number(tamanho.quantity) > 1 && (
  <b className="ml-1">
    ×{tamanho.quantity}
  </b>
)}
                                </span>
                              )
                            )}

                          </div>

                        </div>
                      )}

                      {/* OBSERVAÇÕES */}

                      {produto.notes &&
                        produto.notes.trim() && (
                          <div className="mt-5 bg-gray-50 rounded-xl px-4 py-3">

                            <p className="text-[10px] uppercase tracking-wide font-semibold text-gray-400 mb-1">
                              {t.notes}
                            </p>

                            <p className="text-sm text-gray-600 leading-relaxed">
                              {produto.notes}
                            </p>

                          </div>
                        )}

                      {/* PREÇO / STOCK */}

<div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
                         <div className="flex items-baseline gap-3 flex-wrap">
  {produto.retail_price != null &&
    Number(produto.retail_price) > Number(produto.price) && (
      <span className="text-sm text-gray-400 line-through">
        {Number(produto.retail_price).toFixed(2)} €
      </span>
    )}

  <span
    className={
      produto.retail_price != null &&
      Number(produto.retail_price) > Number(produto.price)
        ? "text-2xl font-bold text-green-700"
        : "text-2xl font-bold text-black"
    }
  >
    {Number(produto.price).toFixed(2)} €
  </span>
</div>
                        <span
                          className={
                            stock > 0
  ? "text-xs font-medium bg-gray-100 text-gray-700 px-4 py-2 rounded-full whitespace-nowrap"
  : "text-xs font-medium bg-red-50 text-red-600 px-4 py-2 rounded-full whitespace-nowrap"
                          }
                        >
                          {stock}{" "}
                          {t.inStock}
                        </span>

                      </div>

                    </div>

                  </article>
                );
              }
            )}

          </div>

        )}

      </section>

    </main>
  );
}