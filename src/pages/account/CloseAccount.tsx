import React from "react";

const CloseAccount: React.FC = () => {
  return (
    <>
      <h1 className="text-3xl max-sm:text-2xl font-bold text-[#EF4118] mb-2">Encerrar conta</h1>
      <hr className="my-6 max-sm:my-4 border-gray-200" />
  <p className="text-base max-sm:text-sm text-[#091747] dark:text-white mb-6 max-sm:mb-4">Obrigado por utilizar a Fauves. Se houver algo que podemos fazer para você permanecer conosco, basta nos dizer.</p>
  <p className="text-base max-sm:text-sm text-[#091747] dark:text-white mb-4 max-sm:mb-3">Disponha de alguns minutos para nos indicar o motivo pelo qual está saindo:</p>
      <form className="flex flex-col gap-6 max-sm:gap-4">
        <div className="flex flex-col gap-2 max-sm:gap-1.5 mb-4 max-sm:mb-3">
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
            <label key={motivo} className="flex items-center gap-3 max-sm:text-sm">
              <input type="radio" name="motivo" className="accent-[#EF4118] w-5 h-5 max-sm:w-4 max-sm:h-4 flex-shrink-0" />
              {motivo}
            </label>
          ))}
        </div>
        <input type="text" placeholder="" className="border border-gray-300 rounded-lg px-4 py-2 max-sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4118]" />
  <label className="text-base max-sm:text-sm text-[#091747] dark:text-white mt-4 max-sm:mt-3 mb-2">Digite "ENCERRAR" e insira sua senha para confirmar que deseja encerrar sua conta</label>
        <input type="text" placeholder="Digite 'ENCERRAR'" className="border border-gray-300 rounded-lg px-4 py-2 max-sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4118]" />
        <input type="password" placeholder="Insira sua senha" autoComplete="current-password" className="border border-gray-300 rounded-lg px-4 py-2 max-sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#EF4118]" />
        <button type="submit" className="bg-[#EF4118] text-white font-bold px-8 py-3 max-sm:w-full rounded-lg text-lg max-sm:text-base shadow hover:bg-[#c72c00] transition-colors mt-4 max-sm:mt-3">Encerrar conta</button>
      </form>
    </>
  );
};

export default CloseAccount;
