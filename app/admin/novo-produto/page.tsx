"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Tamanho = {
  tamanho: string;
  quantidade: string;
};

const TAGS_DISPONIVEIS = [
  { value: "ready_to_ship", label: "Ready to Ship" },
  { value: "new", label: "Novo" },
  { value: "last_unit", label: "Última unidade" },
  { value: "promotion", label: "Promoção" },
];

export default function NovoProdutoPage() {
  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [preco, setPreco] = useState("");

  const [categoria, setCategoria] = useState("sneakers");
  const [tags, setTags] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState("");

  const [imagem, setImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");

  const [tamanhos, setTamanhos] = useState<Tamanho[]>([
    { tamanho: "", quantidade: "" },
  ]);

  const [guardando, setGuardando] = useState(false);

  function adicionarTamanho() {
    setTamanhos([
      ...tamanhos,
      { tamanho: "", quantidade: "" },
    ]);
  }

  function eliminarTamanho(index: number) {
    if (tamanhos.length === 1) return;

    setTamanhos(
      tamanhos.filter((_, i) => i !== index)
    );
  }

  function subirTamanho(index: number) {
    if (index === 0) return;

    const novosTamanhos = [...tamanhos];

    [
      novosTamanhos[index - 1],
      novosTamanhos[index],
    ] = [
      novosTamanhos[index],
      novosTamanhos[index - 1],
    ];

    setTamanhos(novosTamanhos);
  }

  function descerTamanho(index: number) {
    if (index === tamanhos.length - 1) return;

    const novosTamanhos = [...tamanhos];

    [
      novosTamanhos[index],
      novosTamanhos[index + 1],
    ] = [
      novosTamanhos[index + 1],
      novosTamanhos[index],
    ];

    setTamanhos(novosTamanhos);
  }

  function alterarTamanho(
    index: number,
    campo: "tamanho" | "quantidade",
    valor: string
  ) {
    const novosTamanhos = [...tamanhos];

    novosTamanhos[index] = {
      ...novosTamanhos[index],
      [campo]: valor,
    };

    setTamanhos(novosTamanhos);
  }

  function alterarTag(tag: string) {
    setTags((tagsAtuais) => {
      if (tagsAtuais.includes(tag)) {
        return tagsAtuais.filter(
          (tagAtual) => tagAtual !== tag
        );
      }

      return [...tagsAtuais, tag];
    });
  }

  function selecionarImagem(
    ficheiro: File | null
  ) {
    setImagem(ficheiro);

    if (!ficheiro) {
      setPreviewImagem("");
      return;
    }

    const url = URL.createObjectURL(ficheiro);

    setPreviewImagem(url);
  }

  async function guardarProduto() {
    if (guardando) return;

    if (!nome.trim()) {
      alert("Preenche o nome do produto.");
      return;
    }

    if (!sku.trim()) {
      alert("Preenche o SKU.");
      return;
    }

    const precoNumero = Number(preco);

    if (
      preco.trim() === "" ||
      Number.isNaN(precoNumero) ||
      precoNumero < 0
    ) {
      alert("Introduz um preço válido.");
      return;
    }

    for (const item of tamanhos) {
      if (
        item.tamanho.trim() !== "" &&
        item.quantidade.trim() === ""
      ) {
        alert(
          `Indica a quantidade do tamanho ${item.tamanho}.`
        );
        return;
      }

      if (
        item.quantidade !== "" &&
        Number(item.quantidade) < 0
      ) {
        alert(
          "A quantidade não pode ser negativa."
        );
        return;
      }
    }

    setGuardando(true);

    try {
      let imageUrl: string | null = null;

      // =========================
      // UPLOAD DA IMAGEM
      // =========================

      if (imagem) {
        const fileExt =
          imagem.name
            .split(".")
            .pop()
            ?.toLowerCase() || "jpg";

        const fileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}.${fileExt}`;

        const { error: uploadError } =
          await supabase.storage
            .from("product-images")
            .upload(fileName, imagem, {
              cacheControl: "3600",
              upsert: false,
              contentType: imagem.type,
            });

        if (uploadError) {
          console.error(uploadError);
          alert(
            `Erro ao carregar imagem: ${uploadError.message}`
          );
          setGuardando(false);
          return;
        }

        const { data: publicUrlData } =
          supabase.storage
            .from("product-images")
            .getPublicUrl(fileName);

        imageUrl = publicUrlData.publicUrl;
      }

      // =========================
      // CRIAR PRODUTO
      // =========================

      const { data, error } = await supabase
        .from("products")
        .insert({
          name: nome.trim(),
          sku: sku.trim(),
          price: precoNumero,
          image_url: imageUrl,

          category: categoria,
          tags: tags,
          notes:
            observacoes.trim() || null,
        })
        .select()
        .single();

      if (error || !data) {
        console.error(error);

        alert(
          `Erro ao criar produto: ${
            error?.message ||
            "erro desconhecido"
          }`
        );

        setGuardando(false);
        return;
      }

      // =========================
      // TAMANHOS
      // =========================

      const tamanhosParaGuardar =
        tamanhos
          .filter(
            (item) =>
              item.tamanho.trim() !== ""
          )
          .map((item, index) => ({
            product_id: data.id,
            size: item.tamanho.trim(),
            quantity:
              Number(item.quantidade) || 0,
            sort_order: index,
          }));

      if (tamanhosParaGuardar.length > 0) {
        const { error: tamanhosError } =
          await supabase
            .from("product_sizes")
            .insert(tamanhosParaGuardar);

        if (tamanhosError) {
          console.error(tamanhosError);

          alert(
            `Produto criado, mas ocorreu um erro nos tamanhos: ${tamanhosError.message}`
          );

          setGuardando(false);
          return;
        }
      }

      alert("Produto criado com sucesso!");

      window.location.href = "/admin";
    } catch (erro) {
      console.error(erro);

      alert(
        "Ocorreu um erro inesperado ao criar o produto."
      );

      setGuardando(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* TOPO */}

        <button
          type="button"
          onClick={() =>
            (window.location.href = "/admin")
          }
          className="text-sm text-gray-500 hover:text-black mb-6"
        >
          ← Voltar ao painel
        </button>

        <h1 className="text-3xl font-bold">
          Adicionar produto
        </h1>

        <p className="text-gray-500 mt-2">
          Adiciona um novo produto ao inventário.
        </p>

        {/* FORMULÁRIO */}

        <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-8">

          {/* IMAGEM */}

          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2">
              Imagem do produto
            </label>

            {previewImagem && (
              <div className="w-56 h-56 border border-gray-200 rounded-2xl flex items-center justify-center p-4 mb-4">
                <img
                  src={previewImagem}
                  alt="Pré-visualização"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                selecionarImagem(
                  e.target.files?.[0] ||
                    null
                )
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
            />
          </div>

          {/* NOME */}

          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2">
              Nome do produto
            </label>

            <input
              type="text"
              placeholder="Ex: Nike Air Force 1 Low White"
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-black"
            />
          </div>

          {/* SKU + PREÇO */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">

            <div>
              <label className="block text-sm font-semibold mb-2">
                SKU
              </label>

              <input
                type="text"
                placeholder="Ex: CW2288-111"
                value={sku}
                onChange={(e) =>
                  setSku(e.target.value)
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-black"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Preço (€)
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex: 80.00"
                value={preco}
                onChange={(e) =>
                  setPreco(e.target.value)
                }
                className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-black"
              />
            </div>

          </div>

          {/* CATEGORIA */}

          <div className="mb-7">
            <label className="block text-sm font-semibold mb-2">
              Categoria
            </label>

            <select
              value={categoria}
              onChange={(e) =>
                setCategoria(e.target.value)
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white outline-none focus:border-black"
            >
              <option value="sneakers">
                Sneakers
              </option>

              <option value="vestuario">
                Vestuário
              </option>

              <option value="acessorios">
                Acessórios
              </option>
            </select>
          </div>

          {/* TAGS */}

          <div className="mb-7">
            <label className="block text-sm font-semibold mb-1">
              Tags
            </label>

            <p className="text-sm text-gray-500 mb-3">
              Podes selecionar várias.
            </p>

            <div className="flex flex-wrap gap-2">
              {TAGS_DISPONIVEIS.map(
                (tag) => {
                  const selecionada =
                    tags.includes(tag.value);

                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() =>
                        alterarTag(tag.value)
                      }
                      className={
                        selecionada
                          ? "bg-black text-white border border-black px-4 py-2 rounded-full text-sm"
                          : "bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-full text-sm hover:border-gray-400"
                      }
                    >
                      {selecionada
                        ? "✓ "
                        : ""}
                      {tag.label}
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* OBSERVAÇÕES */}

          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2">
              Observações
            </label>

            <textarea
              value={observacoes}
              onChange={(e) =>
                setObservacoes(
                  e.target.value
                )
              }
              placeholder="Ex: Caixa original incluída, envio em 24/48h..."
              rows={4}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-black resize-none"
            />

            <p className="text-xs text-gray-400 mt-2">
              Opcional. Esta informação pode
              aparecer no catálogo.
            </p>
          </div>

          {/* TAMANHOS */}

          <div className="border-t border-gray-200 pt-6">

            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold">
                  Tamanhos e stock
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Adiciona os tamanhos pela ordem
                  em que queres que apareçam.
                </p>
              </div>

              <button
                type="button"
                onClick={adicionarTamanho}
                className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-200"
              >
                + Adicionar tamanho
              </button>
            </div>

            <div className="space-y-3">

              {tamanhos.map(
                (item, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-xl p-4"
                  >

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Tamanho
                        </label>

                        <input
                          type="text"
                          placeholder="Ex: 42"
                          value={
                            item.tamanho
                          }
                          onChange={(e) =>
                            alterarTamanho(
                              index,
                              "tamanho",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-black"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-500 mb-1">
                          Quantidade
                        </label>

                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Ex: 3"
                          value={
                            item.quantidade
                          }
                          onChange={(e) =>
                            alterarTamanho(
                              index,
                              "quantidade",
                              e.target.value
                            )
                          }
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-black"
                        />
                      </div>

                    </div>

                    <div className="flex gap-2 mt-3">

                      <button
                        type="button"
                        onClick={() =>
                          subirTamanho(index)
                        }
                        disabled={
                          index === 0
                        }
                        className="bg-gray-100 px-3 py-2 rounded-lg text-sm disabled:opacity-30"
                      >
                        ↑ Subir
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          descerTamanho(index)
                        }
                        disabled={
                          index ===
                          tamanhos.length -
                            1
                        }
                        className="bg-gray-100 px-3 py-2 rounded-lg text-sm disabled:opacity-30"
                      >
                        ↓ Descer
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          eliminarTamanho(
                            index
                          )
                        }
                        disabled={
                          tamanhos.length ===
                          1
                        }
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm disabled:opacity-30"
                      >
                        Eliminar
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          </div>

          {/* GUARDAR */}

          <button
            type="button"
            onClick={guardarProduto}
            disabled={guardando}
            className="mt-8 w-full bg-black text-white px-5 py-4 rounded-xl font-medium disabled:opacity-50"
          >
            {guardando
              ? "A guardar..."
              : "Guardar produto"}
          </button>

        </div>
      </div>
    </main>
  );
}