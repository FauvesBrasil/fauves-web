import React from "react";

const PersonalData: React.FC = () => {
  return (
    <>
  <h1 className="text-3xl max-sm:text-2xl font-bold text-[#091747] dark:text-white mb-2">Solicitar dados pessoais</h1>
      <hr className="my-6 max-sm:my-4 border-gray-200" />
  <p className="text-base max-sm:text-sm text-[#091747] dark:text-white mb-8 max-sm:mb-6">
        Se você quiser obter uma cópia dos seus dados pessoais armazenados na Fauves, envie uma solicitação em nossa central de privacidade. Uma vez lá, selecione <b>"Assumir o controle"</b>.
      </p>
      <a
        href="https://privacidade.fauves.com.br"
        target="_blank"
        rel="noopener noreferrer"
  className="inline-block max-sm:w-full max-sm:text-center bg-[#2A2AD7] text-white font-bold px-8 py-3 rounded-lg text-lg max-sm:text-base shadow hover:bg-[#091747] transition-colors"
      >
        Ir para central de privacidade
      </a>
    </>
  );
};

export default PersonalData;
