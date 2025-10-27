import React, { useState } from "react";
import CustomCheckbox from "../../components/ui/CustomCheckbox";

const EmailPreferences: React.FC = () => {
  // State for all checkboxes
  const [prefs, setPrefs] = useState({
    // Participando de eventos - Receber E-mails
    participante_novos_recursos: false,
    participante_guia_semanal: false,
    participante_info_adicional: false,
    participante_unsubscribe: false,
    // Participando de eventos - Notificações
    participante_amigos_eventos: false,
    participante_organizador_novo: false,
    participante_colecoes: false,
    participante_lembretes_venda: false,
    participante_lembretes_curti: false,
    // Organizando eventos - Receber E-mails
    organizador_novos_recursos: false,
    organizador_dicas_mensais: false,
    organizador_relatorio_vendas: false,
    organizador_unsubscribe: false,
    // Organizando eventos - Notificações
    organizador_lembretes: false,
    organizador_confirmacoes: false,
  });

  const handleChange = (key: keyof typeof prefs, value: boolean) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <>
  <h1 className="text-3xl font-bold text-[#091747] dark:text-white mb-6">Preferências de e-mail</h1>
      <hr className="my-6 border-gray-200" />
      <form className="flex flex-col gap-10">
          {/* Participando de eventos */}
          <div>
            <h2 className="text-xl font-bold text-[#091747] dark:text-white mb-2">Participando de eventos</h2>
            <p className="text-base text-[#091747] dark:text-white mb-4">Notícias e atualizações sobre eventos criados por organizadores de eventos</p>
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#091747] dark:text-white mb-2">Receber E-mails</h3>
              <div className="flex flex-col gap-2 ml-2">
                <CustomCheckbox checked={prefs.participante_novos_recursos} onChange={v => handleChange("participante_novos_recursos", v)} label="Atualizações sobre novos recursos e anúncios da Fauves" />
                <CustomCheckbox checked={prefs.participante_guia_semanal} onChange={v => handleChange("participante_guia_semanal", v)} label="Guia de eventos semanal da Fauves: Um resumo das nossas recomendações personalizadas de eventos" />
                <CustomCheckbox checked={prefs.participante_info_adicional} onChange={v => handleChange("participante_info_adicional", v)} label="Solicitações para informações adicionais em um evento depois que você participou" />
                <CustomCheckbox checked={prefs.participante_unsubscribe} onChange={v => handleChange("participante_unsubscribe", v)} label="Descadastrar-se de todas as newsletters e atualizações da Fauves para participantes" />
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#091747] dark:text-white mb-2">Notificações</h3>
              <div className="flex flex-col gap-2 ml-2">
                <CustomCheckbox checked={prefs.participante_amigos_eventos} onChange={v => handleChange("participante_amigos_eventos", v)} label="Quando amigos comprarem ingressos ou se inscreverem em eventos perto de mim" />
                <CustomCheckbox checked={prefs.participante_organizador_novo} onChange={v => handleChange("participante_organizador_novo", v)} label="Quando um organizador que você segue anunciar um novo evento." />
                <CustomCheckbox checked={prefs.participante_colecoes} onChange={v => handleChange("participante_colecoes", v)} label="Receba atualizações sobre coleções que você segue" />
                <CustomCheckbox checked={prefs.participante_lembretes_venda} onChange={v => handleChange("participante_lembretes_venda", v)} label="Lembretes sobre eventos à venda" />
                <CustomCheckbox checked={prefs.participante_lembretes_curti} onChange={v => handleChange("participante_lembretes_curti", v)} label="Lembretes sobre eventos que curti" />
              </div>
            </div>
          </div>
          {/* Organizando eventos */}
          <div>
            <h2 className="text-xl font-bold text-[#091747] dark:text-white mb-2">Organizando eventos</h2>
            <p className="text-base text-[#091747] dark:text-white mb-4">Atualizações e dicas úteis para organizar eventos na Fauves</p>
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#091747] dark:text-white mb-2">Receber E-mails</h3>
              <div className="flex flex-col gap-2 ml-2">
                <CustomCheckbox checked={prefs.organizador_novos_recursos} onChange={v => handleChange("organizador_novos_recursos", v)} label="Atualizações sobre novos recursos e anúncios da Fauves" />
                <CustomCheckbox checked={prefs.organizador_dicas_mensais} onChange={v => handleChange("organizador_dicas_mensais", v)} label="Dicas e ferramentas mensais para a organização de eventos" />
                <CustomCheckbox checked={prefs.organizador_relatorio_vendas} onChange={v => handleChange("organizador_relatorio_vendas", v)} label="Relatório de vendas do evento" />
                <CustomCheckbox checked={prefs.organizador_unsubscribe} onChange={v => handleChange("organizador_unsubscribe", v)} label="Descadastrar-se de todas as newsletters e atualizações da Fauves para organizadores de eventos" />
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-base font-bold text-[#091747] dark:text-white mb-2">Notificações</h3>
              <div className="flex flex-col gap-2 ml-2">
                <CustomCheckbox checked={prefs.organizador_lembretes} onChange={v => handleChange("organizador_lembretes", v)} label="Lembretes importantes para o seu próximo evento" />
                <CustomCheckbox checked={prefs.organizador_confirmacoes} onChange={v => handleChange("organizador_confirmacoes", v)} label="Confirmações de pedidos dos meus participantes" />
              </div>
            </div>
          </div>
          <div className="flex justify-start mt-6">
            <button type="submit" className="bg-[#2A2AD7] text-white font-bold px-8 py-3 rounded-lg text-lg shadow hover:bg-[#091747] transition-colors">Salvar preferências</button>
          </div>
        </form>
    </>
  );
};

export default EmailPreferences;
