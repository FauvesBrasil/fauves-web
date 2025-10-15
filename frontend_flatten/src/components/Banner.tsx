import bannerImg from '../assets/banner-facepassv2.jpg';

const Banner: React.FC = () => {
  const handleRegisterEvent = () => {
    console.log('Registering event...');
  };

  return (
    <section className="w-[1040px] h-[365px] relative mx-[156px] my-10 max-md:w-[calc(100%_-_40px)] max-md:mx-5 max-md:my-10 max-sm:w-[calc(100%_-_30px)] max-sm:h-[300px] max-sm:mx-[15px] max-sm:my-5">
      <img
        src={bannerImg}
        alt="FacePass Security Banner"
        className="w-[1040px] h-[365px] rounded-[20px] max-md:w-full max-sm:h-[300px] max-sm:object-cover"
      />
      <div className="absolute inset-0 flex flex-col justify-center px-16 py-14 max-md:px-[30px] max-md:py-10 max-sm:p-5">
        <div className="max-w-[350px]">
          <h2 className="text-white text-[26px] font-bold mb-4 leading-tight max-md:text-[28px] max-sm:text-2xl max-sm:mb-3">
            Sua cara é seu ingresso. Literalmente.
          </h2>
          <p className="text-white text-[18px] font-medium mb-8 leading-relaxed max-md:text-base max-sm:text-sm max-sm:mb-6">
            Chega de QR Code! A gente usa reconhecimento facial pra garantir segurança, só você entra com o seu rosto.
          </p>
          <button 
            onClick={handleRegisterEvent}
            className="w-[260px] h-[45px] flex items-center relative bg-[#F9C900] px-[17px] py-0 rounded-[5px] max-sm:w-full max-sm:max-w-[260px] hover:bg-[#e6b500] transition-colors group"
          >
            <span className="text-[#091747] text-sm font-bold">
              Cadastrar meu evento
            </span>
            <svg 
              width="6" 
              height="10" 
              viewBox="0 0 6 10" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="absolute right-[26px] group-hover:translate-x-1 transition-transform"
            >
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M5.76144 5.55547L1.15212 10L0 8.88906L4.03325 5L0 1.11094L1.15212 0L5.76144 4.44453C5.91419 4.59187 6 4.79167 6 5C6 5.20833 5.91419 5.40813 5.76144 5.55547Z" 
                fill="#091747"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Banner;
