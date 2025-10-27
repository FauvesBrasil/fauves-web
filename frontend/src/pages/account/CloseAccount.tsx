import React from "react";

const CloseAccount: React.FC = () => {
  return (
    <>
      <h1 className="text-3xl font-bold text-[#EF4118] mb-2">Encerrar conta</h1>
      <hr className="my-6 border-gray-200" />
  <p className="text-base text-[#091747] dark:text-white mb-6">Obrigado por utilizar a Fauves. Se houver algo que podemos fazer para você permanecer conosco, basta nos dizer.</p>
  <p className="text-base text-[#091747] dark:text-white mb-4">Disponha de alguns minutos para nos indicar o motivo pelo qual está saindo:</p>
      <form className="flex flex-col gap-6">
        <div className="flex flex-col gap-2 mb-4">
          {[
            "O preço é confuso",
            "Não organizo eventos",
            "Escolhi uma solução diferente",
            "O produto não tem os recursos necessários",
            "Não me lembro de ter me inscrito na Fauves",
            "O produto é muito difícil de usar",
            "O preço é muito alto",
            "Outro (explique)"
          ].map((motivo, idx) => (
            <label key={motivo} className="flex items-center gap-3">
              <input type="radio" name="motivo" className="accent-[#EF4118] w-5 h-5" />
              {motivo}
            </label>
          ))}
        </div>
        <input type="text" placeholder="" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#EF4118]" />
  <label className="text-base text-[#091747] dark:text-white mt-4 mb-2">Digite "ENCERRAR" e insira sua senha para confirmar que deseja encerrar sua conta</label>
        <input type="text" placeholder="Digite 'ENCERRAR'" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#EF4118]" />
        <input type="password" placeholder="Insira sua senha" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#EF4118]" />
        <button type="submit" className="bg-[#EF4118] text-white font-bold px-8 py-3 rounded-lg text-lg shadow hover:bg-[#c72c00] transition-colors mt-4">Encerrar conta</button>
      </form>
    </>
  );
};

export default CloseAccount;
