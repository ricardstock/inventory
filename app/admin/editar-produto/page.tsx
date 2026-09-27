"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Tamanho = {
  id: number | null;
  size: string;
  quantity: string | number;
  sort_order: number;
};

const TAGS_DISPONIVEIS = [
  { value: "ready_to_ship", label: "Ready to Ship" },
  { value: "new", label: "Novo" },
  { value: "last_unit", label: "Última unidade" },
  { value: "promotion", label: "Promoção" },
];

export default function EditarProdutoPage() {
  const [id, setId] = useState<number | null>(null);

  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [preco, setPreco] = useState("");

  const [categoria, setCategoria] = useState("sneakers");
  const [tags, setTags] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState("");

  const [imagemUrl, setImagemUrl] = useState("");
  const [novaImagem, setNovaImagem] = useState<File | null>(null);
  const [previewImagem, setPreviewImagem] = useState("");

  const [tamanhos, setTamanhos] = useState<Tamanho[]>([]);
  const [idsOriginais, setIdsOriginais] = useState<number[]>([]);

  const [carregando, setCarregando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // ==========================================
  // OBTER ID DA URL
  // ==========================================

  useEffect(() => {
    const parametros = new URLSearchParams(
      window.location.search
    );

    const idUrl = Number(parametros.get("id"));

    if (!idUrl || Number.isNaN(idUrl)) {
      alert("ID do produto inválido.");
window.location.href = "/inventory/admin";
      return;
    }

    setId(idUrl);
  }, []);

  // ==========================================
  // CARREGAR PRODUTO
  // ==========================================

  useEffect(() => {
    if (!id) return;

    async function carregarProduto() {
      setCarregando(true);

      const { data, error } = await supabase
        .from("products")
        .select(`
          id,
          name,
          sku,
          price,
          image_url,
          category,
          tags,
          notes,
          product_sizes (
            id,
            size,
            quantity,
            sort_order
          )
        `)
        .eq("id", id)
        .single();

      if (error || !data) {
        console.error(
          "Erro ao carregar produto:",
          error
        );

        alert("Erro ao carregar o produto.");
        window.location.href = "/inventory/admin";
        return;
      }

      setNome(data.name ?? "");
      setSku(data.sku ?? "");
      setPreco(String(data.price ?? ""));
      setImagemUrl(data.image_url ?? "");

      setCategoria(data.category ?? "sneakers");

      setTags(
        Array.isArray(data.tags)
          ? data.tags
          : []
      );

      setObservacoes(data.notes ?? "");

      const lista: Tamanho[] = (
        data.product_sizes ?? []
      )
        .map((item: any) => ({
          id: item.id,
          size: String(item.size ?? ""),
          quantity: item.quantity ?? 0,
          sort_order: item.sort_order ?? 0,
        }))
        .sort(
          (a: Tamanho, b: Tamanho) =>
            a.sort_order - b.sort_order
        );

      setTamanhos(lista);

      setIdsOriginais(
        lista
          .filter(
            (item) => item.id !== null
          )
          .map(
            (item) => item.id as number
          )
      );

      setCarregando(false);
    }

    carregarProduto();
  }, [id]);

  // ==========================================
  // PREVIEW DA NOVA IMAGEM
  // ==========================================

  useEffect(() => {
    if (!novaImagem) {
      setPreviewImagem("");
      return;
    }

    const url = URL.createObjectURL(
      novaImagem
    );

    setPreviewImagem(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [novaImagem]);

  // ==========================================
  // TAGS
  // ==========================================

  function alterarTag(tag: string) {
    setTags((tagsAtuais) => {
      if (tagsAtuais.includes(tag)) {
        return tagsAtuais.filter(
          (tagAtual) =>
            tagAtual !== tag
        );
      }

      return [...tagsAtuais, tag];
    });
  }

  // ==========================================
  // TAMANHOS
  // ==========================================

  function alterarTamanho(
    index: number,
    campo: "size" | "quantity",
    valor: string
  ) {
    setTamanhos((anteriores) =>
      anteriores.map((item, i) =>
        i === index
          ? {
              ...item,
              [campo]: valor,
            }
          : item
      )
    );
  }

  function adicionarTamanho() {
    setTamanhos((anteriores) => [
      ...anteriores,
      {
        id: null,
        size: "",
        quantity: "",
        sort_order:
          anteriores.length,
      },
    ]);
  }

  function eliminarTamanho(
    index: number
  ) {
    setTamanhos((anteriores) =>
      anteriores.filter(
        (_, i) => i !== index
      )
    );
  }

  function subirTamanho(
    index: number
  ) {
    if (index === 0) return;

    setTamanhos((anteriores) => {
      const novaLista = [
        ...anteriores,
      ];

      [
        novaLista[index - 1],
        novaLista[index],
      ] = [
        novaLista[index],
        novaLista[index - 1],
      ];

      return novaLista;
    });
  }

  function descerTamanho(
    index: number
  ) {
    setTamanhos((anteriores) => {
      if (
        index ===
        anteriores.length - 1
      ) {
        return anteriores;
      }

      const novaLista = [
        ...anteriores,
      ];

      [
        novaLista[index],
        novaLista[index + 1],
      ] = [
        novaLista[index + 1],
        novaLista[index],
      ];

      return novaLista;
    });
  }

  // ==========================================
  // GUARDAR
  // ==========================================

  async function guardarAlteracoes() {
    if (guardando) return;

    if (!id) {
      alert("ID do produto inválido.");
      return;
    }

    if (!nome.trim()) {
      alert(
        "Introduz o nome do produto."
      );
      return;
    }

    if (!sku.trim()) {
      alert("Introduz o SKU.");
      return;
    }

    const precoNumero = Number(
      preco
    );

    if (
      preco.trim() === "" ||
      Number.isNaN(precoNumero) ||
      precoNumero < 0
    ) {
      alert(
        "Introduz um preço válido."
      );
      return;
    }

    // Validar tamanhos

    for (const tamanho of tamanhos) {
      if (
        String(tamanho.size).trim() ===
        ""
      ) {
        alert(
          "Existem tamanhos vazios."
        );
        return;
      }

      const quantidade = Number(
        tamanho.quantity
      );

      if (
        String(
          tamanho.quantity
        ).trim() === "" ||
        Number.isNaN(quantidade) ||
        quantidade < 0 ||
        !Number.isInteger(
          quantidade
        )
      ) {
        alert(
          `A quantidade do tamanho ${tamanho.size} não é válida.`
        );
        return;
      }
    }

    setGuardando(true);

    try {
      // ======================================
      // 1. IMAGEM
      // ======================================

      let imagemFinal = imagemUrl;

      if (novaImagem) {
        if (
          !novaImagem.type.startsWith(
            "image/"
          )
        ) {
          alert(
            "O ficheiro selecionado não é uma imagem."
          );

          setGuardando(false);
          return;
        }

        const extensao =
          novaImagem.name
            .split(".")
            .pop()
            ?.toLowerCase() ||
          "jpg";

        const nomeFicheiro =
          `${id}-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 8)}.${extensao}`;

        const {
          error: erroUpload,
        } = await supabase.storage
          .from("product-images")
          .upload(
            nomeFicheiro,
            novaImagem,
            {
              cacheControl: "3600",
              upsert: false,
              contentType:
                novaImagem.type,
            }
          );

        if (erroUpload) {
          console.error(
            "Erro no upload:",
            erroUpload
          );

          alert(
            `Erro ao carregar a nova imagem: ${erroUpload.message}`
          );

          setGuardando(false);
          return;
        }

        const {
          data: urlData,
        } = supabase.storage
          .from("product-images")
          .getPublicUrl(
            nomeFicheiro
          );

        imagemFinal =
          urlData.publicUrl;
      }

      // ======================================
      // 2. ATUALIZAR PRODUTO
      // ======================================

      const {
        data: produtoAtualizado,
        error: erroProduto,
      } = await supabase
        .from("products")
        .update({
          name: nome.trim(),
          sku: sku.trim(),
          price: precoNumero,
          image_url: imagemFinal,
          category: categoria,
          tags: tags,
          notes:
            observacoes.trim() ||
            null,
        })
        .eq("id", id)
        .select(`
          id,
          name,
          sku,
          price,
          image_url,
          category,
          tags,
          notes
        `)
        .single();

      if (
        erroProduto ||
        !produtoAtualizado
      ) {
        console.error(
          "ERRO AO ATUALIZAR:",
          erroProduto
        );

        alert(
          `Erro ao guardar:\n${
            erroProduto?.message ||
            "Produto não atualizado"
          }`
        );

        setGuardando(false);
        return;
      }

      // ======================================
      // 3. IDS ATUAIS
      // ======================================

      const idsAtuais =
        tamanhos
          .filter(
            (item) =>
              item.id !== null
          )
          .map(
            (item) =>
              item.id as number
          );

      // ======================================
      // 4. TAMANHOS ELIMINADOS
      // ======================================

      const idsParaEliminar =
        idsOriginais.filter(
          (idOriginal) =>
            !idsAtuais.includes(
              idOriginal
            )
        );

      if (
        idsParaEliminar.length > 0
      ) {
        const {
          error: erroEliminar,
        } = await supabase
          .from("product_sizes")
          .delete()
          .in(
            "id",
            idsParaEliminar
          )
          .eq(
            "product_id",
            id
          );

        if (erroEliminar) {
          console.error(
            "Erro ao eliminar tamanhos:",
            erroEliminar
          );

          alert(
            `Erro ao eliminar tamanhos: ${erroEliminar.message}`
          );

          setGuardando(false);
          return;
        }
      }

      // ======================================
      // 5. ATUALIZAR TAMANHOS EXISTENTES
      // ======================================

      for (
        let index = 0;
        index < tamanhos.length;
        index++
      ) {
        const tamanho =
          tamanhos[index];

        if (
          tamanho.id === null
        ) {
          continue;
        }

        const {
          error,
        } = await supabase
          .from("product_sizes")
          .update({
            size: String(
              tamanho.size
            ).trim(),

            quantity: Number(
              tamanho.quantity
            ),

            sort_order: index,
          })
          .eq(
            "id",
            tamanho.id
          )
          .eq(
            "product_id",
            id
          );

        if (error) {
          console.error(
            "Erro ao atualizar tamanho:",
            error
          );

          alert(
            `Erro ao atualizar o tamanho ${tamanho.size}: ${error.message}`
          );

          setGuardando(false);
          return;
        }
      }

      // ======================================
      // 6. INSERIR TAMANHOS NOVOS
      // ======================================

      const tamanhosNovos =
        tamanhos
          .map(
            (item, index) => ({
              ...item,
              posicao: index,
            })
          )
          .filter(
            (item) =>
              item.id === null
          );

      if (
        tamanhosNovos.length > 0
      ) {
        const dadosNovos =
          tamanhosNovos.map(
            (item) => ({
              product_id: id,

              size: String(
                item.size
              ).trim(),

              quantity: Number(
                item.quantity
              ),

              sort_order:
                item.posicao,
            })
          );

        const {
          error: erroInserir,
        } = await supabase
          .from("product_sizes")
          .insert(
            dadosNovos
          );

        if (erroInserir) {
          console.error(
            "Erro ao inserir tamanhos:",
            erroInserir
          );

          alert(
            `Erro ao adicionar tamanhos: ${erroInserir.message}`
          );

          setGuardando(false);
          return;
        }
      }

      // ======================================
      // SUCESSO
      // ======================================

      alert(
        "Produto atualizado com sucesso!"
      );

      window.location.href =
        "/inventory/admin/";

    } catch (erro) {
      console.error(
        "Erro inesperado:",
        erro
      );

      alert(
        "Ocorreu um erro inesperado ao guardar."
      );

      setGuardando(false);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (carregando) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto px-8 py-10">
          <p>
            A carregar produto...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // PÁGINA
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-100">

      <div className="max-w-4xl mx-auto px-6 py-10">

        <button
          type="button"
          onClick={() =>
            (window.location.href =
              "/inventory/admin/")
          }
          className="text-sm text-gray-500 hover:text-black mb-6"
        >
          ← Voltar ao painel
        </button>

        <h1 className="text-3xl font-bold">
          Editar produto
        </h1>

        <p className="text-gray-500 mt-2">
          Altera os dados do produto.
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-8">

          {/* IMAGEM */}

          <div className="mb-8">

            <label className="block text-sm font-semibold mb-3">
              Imagem do produto
            </label>

            {(previewImagem ||
              imagemUrl) && (
              <div className="w-56 h-56 border border-gray-200 rounded-2xl flex items-center justify-center p-4 mb-4">

                <img
                  src={
                    previewImagem ||
                    imagemUrl
                  }
                  alt={nome}
                  className="w-full h-full object-contain"
                />

              </div>
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setNovaImagem(
                  e.target.files?.[0] ||
                    null
                )
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-3"
            />

            {novaImagem && (
              <p className="text-sm text-gray-500 mt-2">
                Nova imagem:{" "}
                {novaImagem.name}
              </p>
            )}

            <p className="text-xs text-gray-400 mt-2">
              Se não escolheres outra imagem,
              a atual será mantida.
            </p>

          </div>

          {/* NOME */}

          <div className="mb-5">

            <label className="block text-sm font-semibold mb-2">
              Nome do produto
            </label>

            <input
              type="text"
              value={nome}
              onChange={(e) =>
                setNome(e.target.value)
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-black"
            />

          </div>

          {/* SKU + PREÇO */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">

            <div>

              <label className="block text-sm font-semibold mb-2">
                SKU
              </label>

              <input
                type="text"
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
                step="0.01"
                min="0"
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
                setCategoria(
                  e.target.value
                )
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
              Seleciona todas as etiquetas
              que se aplicam ao produto.
            </p>

            <div className="flex flex-wrap gap-2">

              {TAGS_DISPONIVEIS.map(
                (tag) => {

                  const selecionada =
                    tags.includes(
                      tag.value
                    );

                  return (
                    <button
                      key={tag.value}
                      type="button"
                      onClick={() =>
                        alterarTag(
                          tag.value
                        )
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

          </div>

          {/* TAMANHOS */}

          <div className="border-t border-gray-200 pt-6">

            <div className="flex items-center justify-between gap-4 mb-5">

              <div>

                <h2 className="text-xl font-bold">
                  Tamanhos e stock
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {tamanhos.length} tamanho(s)
                </p>

              </div>

              <button
                type="button"
                onClick={
                  adicionarTamanho
                }
                className="bg-gray-100 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
              >
                + Adicionar tamanho
              </button>

            </div>

            <div className="space-y-3">

              {tamanhos.map(
                (tamanho, index) => (

                  <div
                    key={
                      tamanho.id !==
                      null
                        ? `existente-${tamanho.id}`
                        : `novo-${index}`
                    }
                    className="border border-gray-200 rounded-xl p-4"
                  >

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

                      <div>

                        <label className="block text-xs text-gray-500 mb-1">
                          Tamanho
                        </label>

                        <input
                          type="text"
                          value={
                            tamanho.size
                          }
                          onChange={(e) =>
                            alterarTamanho(
                              index,
                              "size",
                              e.target
                                .value
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
                          value={
                            tamanho.quantity
                          }
                          onChange={(e) =>
                            alterarTamanho(
                              index,
                              "quantity",
                              e.target
                                .value
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
                          subirTamanho(
                            index
                          )
                        }
                        disabled={
                          index === 0
                        }
                        className="bg-gray-100 px-3 py-2 rounded-lg text-sm disabled:opacity-40"
                      >
                        ↑ Subir
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          descerTamanho(
                            index
                          )
                        }
                        disabled={
                          index ===
                          tamanhos.length -
                            1
                        }
                        className="bg-gray-100 px-3 py-2 rounded-lg text-sm disabled:opacity-40"
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
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm"
                      >
                        Eliminar tamanho
                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

            {tamanhos.length ===
              0 && (
              <div className="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500">
                Este produto não tem tamanhos.
              </div>
            )}

          </div>

          {/* GUARDAR */}

          <button
            type="button"
            onClick={
              guardarAlteracoes
            }
            disabled={guardando}
            className="w-full bg-black text-white rounded-xl py-4 font-medium mt-8 disabled:opacity-50"
          >
            {guardando
              ? "A guardar..."
              : "Guardar alterações"}
          </button>

        </div>
      </div>
    </main>
  );
}