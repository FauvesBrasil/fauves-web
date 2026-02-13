import React from "react";

const FacePass: React.FC = () => {
  const [success, setSuccess] = React.useState(false);
  return (
    <>
  <h1 className="text-3xl max-sm:text-2xl font-bold text-[#091747] dark:text-white mb-2">FacePass</h1>
      <hr className="my-6 max-sm:my-4 border-gray-200" />
      {!success ? (
        <>
          <label className="text-base max-sm:text-sm text-[#091747] dark:text-white mb-4 block">Cadastre sua foto para utilizar o FacePass</label>
          <div className="mb-8 max-sm:mb-6">
            <div className="w-[120px] h-[120px] max-sm:w-[100px] max-sm:h-[100px] bg-gray-50 border border-gray-200 rounded-xl max-sm:rounded-lg flex items-center justify-center">
              <label htmlFor="facepass-upload" className="flex flex-col items-center justify-center cursor-pointer w-full h-full">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mb-2 max-sm:w-6 max-sm:h-6 text-[#2A2AD7]"><path d="M12 16v-4m0 0V8m0 4h4m-4 0H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span className="text-xs max-sm:text-[11px] font-semibold text-[#2A2AD7]">Carregar imagem</span>
                <input id="facepass-upload" type="file" className="hidden" />
              </label>
            </div>
          </div>
          <button type="button" className="bg-[#2A2AD7] text-white font-bold px-8 py-3 max-sm:w-full rounded-lg text-base max-sm:text-sm shadow hover:bg-[#091747] transition-colors" onClick={() => setSuccess(true)}>Enviar</button>
        </>
      ) : (
        <div className="bg-green-400 text-white font-semibold rounded-lg px-6 py-3 max-sm:px-4 max-sm:py-2 max-sm:text-sm flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="max-sm:w-4 max-sm:h-4 flex-shrink-0"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Você já cadastrou seu Facepass. Tudo certo por aqui!
        </div>
      )}
    </>
  );
};

export default FacePass;
