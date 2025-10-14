import React from "react";

const PersonalData: React.FC = () => {
  return (
    <>
      <h1 className="text-3xl font-bold text-[#091747] mb-2">Solicitar dados pessoais</h1>
      <hr className="my-6 border-gray-200" />
      <p className="text-base text-[#091747] mb-8">
        Se você quiser obter uma cópia dos seus dados pessoais armazenados na Fauves, envie uma solicitação em nossa central de privacidade. Uma vez lá, selecione <b>“Assumir o controle”</b>.
      </p>
      <a
        href="https://privacidade.fauves.com.br"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#2A2AD7] text-white font-bold px-8 py-3 rounded-lg text-lg shadow hover:bg-[#091747] transition-colors"
      >
        Ir para central de privacidade
      </a>
    </>
  );
};

export default PersonalData;
