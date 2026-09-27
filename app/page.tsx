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

    return produtos.filter((produto) => {
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

      return (
        correspondeCategoria &&
        correspondePesquisa
      );
    });
  }, [
    produtos,
    pesquisa,
    categoria,
  ]);

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

        {/* PESQUISA */}

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">

          <div className="w-full lg:max-w-xl">

            <input
              type="text"
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(e.target.value)
              }
              placeholder={t.search}
              className="w-full bg-white border border-gray-200 rounded-2xl px-5 py-4 outline-none focus:border-black transition"
            />

          </div>

          <div className="text-sm text-gray-400">
            {produtosFiltrados.length}{" "}
            {language === "en"
              ? "products"
              : "produtos"}
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
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition"
                  >

                    {/* IMAGEM */}

                    <div className="h-72 bg-white flex items-center justify-center p-8 relative">

                      <img
                        src={
                          produto.image_url ||
                          "/products/air-force-white.png"
                        }
                        alt={produto.name}
                        className="w-full h-full object-contain"
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

                    <div className="p-6">

                      <p className="text-[11px] text-gray-400 tracking-wide mb-2">
                        {produto.sku}
                      </p>

                      <h2 className="text-lg font-bold leading-snug">
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
                        <div className="mt-6">

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
                                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                >
                                  {tamanho.size}

                                  <b className="ml-1">
                                    ×
                                    {
                                      tamanho.quantity
                                    }
                                  </b>
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

                      <div className="flex justify-between items-end mt-7 pt-5 border-t border-gray-100">

                        <div>
  <p className="text-xl font-bold">
    {Number(produto.price).toFixed(2)} €
  </p>
</div>

                        <span
                          className={
                            stock > 0
                              ? "text-xs bg-gray-100 px-3 py-2 rounded-full"
                              : "text-xs bg-red-50 text-red-600 px-3 py-2 rounded-full"
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