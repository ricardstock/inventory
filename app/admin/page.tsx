"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aEliminar, setAEliminar] = useState<number | null>(null);

  // ==========================================
  // VERIFICAR SESSÃO
  // ==========================================

  useEffect(() => {
    async function verificarSessao() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setLoggedIn(true);
      }

      setCarregando(false);
    }

    verificarSessao();

    // Mantém o estado atualizado caso a sessão
    // seja alterada
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setLoggedIn(!!session);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ==========================================
  // CARREGAR PRODUTOS
  // ==========================================

  useEffect(() => {
    if (!loggedIn) return;

    async function carregarProdutos() {
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

        alert(
          `Erro ao carregar produtos: ${error.message}`
        );

        return;
      }

      setProdutos(data || []);
    }

    carregarProdutos();
  }, [loggedIn]);

  // ==========================================
  // LOGIN
  // ==========================================

  async function handleLogin() {
    if (!email.trim() || !password) {
      alert("Preenche o email e a password.");
      return;
    }

    const { error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (error) {
      console.error(error);
      alert(error.message);
      return;
    }

    setLoggedIn(true);
  }

  // ==========================================
  // LOGOUT
  // ==========================================

  async function handleLogout() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(error);
      alert(
        `Erro ao terminar sessão: ${error.message}`
      );
      return;
    }

    setLoggedIn(false);
    setProdutos([]);
  }

  // ==========================================
  // ELIMINAR PRODUTO
  // ==========================================

  async function eliminarProduto(
    produtoId: number
  ) {
    if (aEliminar !== null) return;

    const confirmar = window.confirm(
      "Tens a certeza que queres eliminar este produto?\n\nEsta ação não pode ser anulada."
    );

    if (!confirmar) return;

    setAEliminar(produtoId);

    try {
      // ======================================
      // 1. ELIMINAR TAMANHOS
      // ======================================

      const {
        error: erroTamanhos,
      } = await supabase
        .from("product_sizes")
        .delete()
        .eq("product_id", produtoId);

      if (erroTamanhos) {
        console.error(
          "Erro ao eliminar tamanhos:",
          erroTamanhos
        );

        alert(
          `Erro ao eliminar tamanhos: ${erroTamanhos.message}`
        );

        setAEliminar(null);
        return;
      }

      // ======================================
      // 2. ELIMINAR PRODUTO
      // ======================================

      const {
        error: erroProduto,
      } = await supabase
        .from("products")
        .delete()
        .eq("id", produtoId);

      if (erroProduto) {
        console.error(
          "Erro ao eliminar produto:",
          erroProduto
        );

        alert(
          `Erro ao eliminar produto: ${erroProduto.message}`
        );

        setAEliminar(null);
        return;
      }

      // ======================================
      // 3. ATUALIZAR PAINEL
      // ======================================

      setProdutos(
        (produtosAtuais) =>
          produtosAtuais.filter(
            (produto) =>
              produto.id !== produtoId
          )
      );

      alert(
        "Produto eliminado com sucesso!"
      );
    } catch (erro) {
      console.error(
        "Erro inesperado:",
        erro
      );

      alert(
        "Ocorreu um erro inesperado ao eliminar o produto."
      );
    }

    setAEliminar(null);
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (carregando) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-10">
          <p className="text-gray-500">
            A carregar...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAINEL ADMIN
  // ==========================================

  if (loggedIn) {
    return (
      <main className="min-h-screen bg-gray-100">
        <div className="max-w-6xl mx-auto px-8 py-10">

          {/* CABEÇALHO */}

          <div className="flex items-start justify-between gap-4">

            <div>
              <h1 className="text-3xl font-bold">
                Painel de Administração
              </h1>

              <p className="text-gray-500 mt-2">
                Bem-vindo ao teu inventário.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="border border-gray-200 bg-white px-4 py-2 rounded-xl text-sm hover:border-gray-400"
            >
              Terminar sessão
            </button>

          </div>

          {/* ADICIONAR PRODUTO */}

          <button
            type="button"
            onClick={() =>
  (window.location.href =
    "/inventory/admin/novo-produto/")
}
            className="mt-7 bg-black text-white px-5 py-3 rounded-xl font-medium"
          >
            + Adicionar produto
          </button>

          {/* PRODUTOS */}

          <div className="mt-10">

            <h2 className="text-xl font-bold">
              Produtos ({produtos.length})
            </h2>

            <div className="mt-5 space-y-3">

              {produtos.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
                  Ainda não tens produtos.
                </div>
              ) : (
                produtos.map((produto) => {

                  const stockTotal = (
                    produto.product_sizes ||
                    []
                  ).reduce(
                    (
                      total: number,
                      tamanho: any
                    ) =>
                      total +
                      Number(
                        tamanho.quantity || 0
                      ),
                    0
                  );

                  return (
                    <div
                      key={produto.id}
                      className="bg-white border border-gray-200 rounded-xl p-4"
                    >

                      <div className="flex flex-col sm:flex-row gap-4">

                        {/* IMAGEM */}

                        {produto.image_url ? (
                          <div className="w-24 h-24 bg-white border border-gray-100 rounded-xl flex items-center justify-center p-2 shrink-0">
                            <img
                              src={
                                produto.image_url
                              }
                              alt={
                                produto.name
                              }
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400 shrink-0">
                            Sem imagem
                          </div>
                        )}

                        {/* INFORMAÇÃO */}

                        <div className="flex-1">

                          <p className="font-semibold">
                            {produto.name}
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            SKU:{" "}
                            {produto.sku}
                          </p>

                          <p className="text-sm font-medium mt-2">
                            {Number(
                              produto.price
                            )
                              .toFixed(2)
                              .replace(
                                ".",
                                ","
                              )}{" "}
                            €
                          </p>

                          <p className="text-sm text-gray-500 mt-1">
                            {stockTotal}{" "}
                            em stock
                          </p>

                          {/* CATEGORIA */}

                          {produto.category && (
                            <span className="inline-block mt-2 bg-gray-100 px-3 py-1 rounded-full text-xs">
                              {produto.category ===
                              "sneakers"
                                ? "Sneakers"
                                : produto.category ===
                                  "vestuario"
                                ? "Vestuário"
                                : produto.category ===
                                  "acessorios"
                                ? "Acessórios"
                                : produto.category}
                            </span>
                          )}

                        </div>

                        {/* BOTÕES */}

                        <div className="flex sm:flex-col gap-2 justify-center">

                          <button
                            type="button"
                            onClick={() =>
  (window.location.href =
    `/inventory/admin/editar-produto/?id=${produto.id}`)
}
                            className="bg-black text-white px-4 py-2 rounded-lg text-sm"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            disabled={
                              aEliminar ===
                              produto.id
                            }
                            onClick={() =>
                              eliminarProduto(
                                produto.id
                              )
                            }
                            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                          >
                            {aEliminar ===
                            produto.id
                              ? "A eliminar..."
                              : "Eliminar"}
                          </button>

                        </div>

                      </div>

                    </div>
                  );
                })
              )}

            </div>

          </div>

        </div>
      </main>
    );
  }

  // ==========================================
  // LOGIN
  // ==========================================

  return (
    <main className="min-h-screen bg-gray-100">

      <div className="max-w-6xl mx-auto px-8 py-10">

        <h1 className="text-3xl font-bold">
          Painel de Administração
        </h1>

        <p className="text-gray-500 mt-2">
          Gere os produtos e o stock do teu inventário.
        </p>

        <div className="mt-8 max-w-md bg-white p-6 rounded-2xl border border-gray-200">

          <label className="block text-sm font-medium mb-2">
            Email
          </label>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 outline-none focus:border-black"
          />

          <label className="block text-sm font-medium mb-2">
            Password
          </label>

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleLogin();
              }
            }}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 outline-none focus:border-black"
          />

          <button
            type="button"
            onClick={handleLogin}
            className="w-full bg-black text-white rounded-xl py-3 font-medium"
          >
            Entrar
          </button>

        </div>

      </div>

    </main>
  );
}