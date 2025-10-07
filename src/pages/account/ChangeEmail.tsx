import React from "react";

const ChangeEmail: React.FC = () => {
  return (
    <div className="flex-1 flex justify-center items-start py-12 px-8 bg-[#F8F7FA]">
      <div className="w-full max-w-[700px] bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
        <h1 className="text-3xl font-bold text-[#091747] mb-2">Alterar e-mail</h1>
        <hr className="my-6 border-gray-200" />
        <div className="mb-6">
          <h2 className="text-base font-bold text-[#091747] mb-2">Endereço de e-mail da conta</h2>
          <span className="text-base text-[#091747]">levy@fauves.com.br</span>
        </div>
        <button type="button" className="bg-[#2A2AD7] text-white font-bold px-6 py-2 rounded-lg text-base shadow hover:bg-[#091747] transition-colors">Alterar</button>
      </div>
    </div>
  );
};

export default ChangeEmail;
