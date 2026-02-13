"use client";
import * as React from "react";
import { useState } from "react";
import { ChevronLeft, ChevronDown, ExternalLink, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Lista de UFs do Brasil para seleção rápida
const BRAZIL_UFS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA",
  "MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN",
  "RS","RO","RR","SC","SP","SE","TO"
] as const;

function CriarEditarEvento() {
  const [eventName, setEventName] = useState("Nome do evento");
  const [eventSubtitle, setEventSubtitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [locationType, setLocationType] = useState<
    "Local" | "Evento online" | "Local será anunciado em breve"
  >("Local");
  const [locationAddress, setLocationAddress] = useState("");
  const [onlineUrl, setOnlineUrl] = useState("");
  // Estado e cidade quando o local ainda será anunciado
  const [tbdUf, setTbdUf] = useState("");
  const [tbdCity, setTbdCity] = useState("");
  const [selectedOrganizer, setSelectedOrganizer] = useState("Fauves entretenimento");
  const [eventStatus, setEventStatus] = useState("Rascunho");

  // Erros simples de validação ao salvar
  const [errors, setErrors] = useState<{ tbd?: string; url?: string }>({});

  const handleSaveContinue = () => {
    const newErrors: { tbd?: string; url?: string } = {};
    if (locationType === "Evento online") {
      if (!onlineUrl || !/^https?:\/\//i.test(onlineUrl)) {
        newErrors.url = "Informe uma URL válida começando com http:// ou https://";
      }
    }
    if (locationType === "Local será anunciado em breve") {
      if (!tbdUf || !tbdCity.trim()) {
        newErrors.tbd = "Informe Estado (UF) e Cidade";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // TODO: integrar com backend/rota para salvar rascunho
    // Por ora, apenas loga o payload
    const payload = {
      eventName,
      eventSubtitle,
      eventDescription,
      startDate,
      startTime,
      endDate,
      endTime,
      locationType,
      location: {
        address: locationAddress || undefined,
        onlineUrl: onlineUrl || undefined,
        uf: tbdUf || undefined,
        city: tbdCity || undefined,
      },
      organizer: selectedOrganizer,
      status: eventStatus,
    };
    console.log("Salvar e continuar:", payload);
  };

  const handleSetLocationType = (type: "Local" | "Evento online" | "Local será anunciado em breve") => {
    setLocationType(type);
    // limpar mensagens de erro ao trocar
    setErrors({});
    console.log("Alterando tipo de localização para:", type);
    if (type === "Local") {
      setOnlineUrl("");
      setTbdUf("");
      setTbdCity("");
    } else if (type === "Evento online") {
      setLocationAddress("");
      setTbdUf("");
      setTbdCity("");
    } else {
      // Local será anunciado em breve
      setLocationAddress("");
      setOnlineUrl("");
    }
  };

  return (
    <div
      className="flex overflow-hidden flex-wrap bg-white rounded-3xl min-h-screen"
      data-name="Criar/Editar Evento"
    >
      {/* Left narrow sidebar */}
      <div className="flex flex-col px-3.5 pt-4 bg-gray-50 border-r border-gray-100 w-[70px] min-h-screen max-md:hidden">
        <img
          src="https://api.builder.io/api/v1/image/assets/657d21e1d95a46adb49d1f36995debd1/934e43ed4e9d14c0db2d7054c169f467abb1f6d2?placeholderIfAbsent=true"
          className="object-contain w-10 aspect-square"
          alt="Logo"
        />
        <div className="flex shrink-0 mt-24 w-10 h-10 bg-orange-600 rounded-md max-md:mt-10" />
        <img
          src="https://api.builder.io/api/v1/image/assets/657d21e1d95a46adb49d1f36995debd1/ad9322bdcba3d6935972050a6806bab28f9429a9?placeholderIfAbsent=true"
          className="object-contain mt-24 aspect-square w-[25px] max-md:mt-10 max-md:mr-2 max-md:ml-2"
          alt="Calendar icon"
        />
        <img
          src="https://api.builder.io/api/v1/image/assets/657d21e1d95a46adb49d1f36995debd1/d6d5d02c96173237d84c0fe59fc0f6dd4d1d4cc9?placeholderIfAbsent=true"
          className="object-contain self-center mt-80 w-6 aspect-square max-md:mt-10"
          alt="Help icon"
        />
      </div>

      {/* Middle panel with event details and steps */}
      <div className="flex flex-col pt-6 bg-gray-50 border-r border-gray-100 w-[280px] min-h-screen text-indigo-950 max-md:w-full">
        {/* Back button */}
        <div className="flex gap-4 self-start ml-6 text-sm text-indigo-700 max-md:ml-2.5">
          <ChevronLeft className="w-[5px] h-4 my-auto" />
          <div className="basis-auto cursor-pointer hover:text-indigo-900" data-name="Voltar para eventos">
            Voltar para eventos
          </div>
        </div>
        
        {/* Separator */}
        <div className="shrink-0 mt-5 h-px border border-solid border-neutral-300" />
        
        {/* Event card */}
        <div className="flex flex-col px-3 mt-3 font-semibold">
          <Card className="px-7 py-7 w-full bg-white rounded-xl shadow-[4px_4px_10px_rgba(0,0,0,0.05)]">
            <div className="self-start text-xl mb-7" data-name="Nome do evento">
              {eventName}
            </div>
            <div
              className="text-center text-xs mb-14"
              data-name="15 janeiro 2025 às 18:30"
            >
              15 janeiro 2025 às 18:30
            </div>
            <div className="flex gap-5 justify-between text-sm">
              <div className="flex gap-6 px-5 py-3 border border-solid border-stone-300 rounded-[100px]">
                <div data-name="Rascunho">Rascunho</div>
                <ChevronDown className="w-2 h-auto my-auto" />
              </div>
              <ExternalLink className="w-[18px] h-[18px] my-auto text-gray-600" />
            </div>
          </Card>
          
          {/* Steps label */}
          <div
            className="self-start mt-11 ml-3.5 text-xs max-md:mt-10 max-md:ml-2.5"
            data-name="Etapas"
          >
            Etapas
          </div>
        </div>

        {/* Steps */}
        <div className="flex flex-col mt-3">
          {/* Active step */}
          <div className="flex flex-col px-12 py-6 bg-white max-md:px-5">
            <div
              className="self-start text-sm font-semibold"
              data-name="Criar página do evento"
            >
              Criar página do evento
            </div>
            <div
              className="mt-1 text-xs"
              data-name="Adicionar todos os detalhes do seu evento e comunicar aos participantes o que esperar"
            >
              Adicionar todos os detalhes do seu evento e comunicar aos
              participantes o que esperar
            </div>
          </div>

          {/* Other steps */}
          <div className="flex flex-col self-center mt-7 max-w-full text-sm font-semibold w-[132px]">
            <div className="px-6" data-name="Configurar ingresso">Configurar ingresso</div>
            <div className="self-start mt-14 px-6 max-md:mt-10" data-name="Publicar">
              Publicar
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex flex-col text-indigo-950 flex-1 max-md:max-w-full">
        {/* Top navigation */}
        <div className="flex items-center px-5 py-3.5 w-full text-sm font-semibold bg-white border-b border-zinc-100 min-h-[60px] max-md:max-w-full">
          <div className="flex gap-6 items-center self-stretch my-auto min-w-60">
            <div className="self-stretch my-auto" data-name="Explorar">
              Explorar
            </div>
            <div className="self-stretch my-auto" data-name="Criar evento">
              Criar evento
            </div>
            <Button className="bg-blue-800 hover:bg-blue-900 text-white rounded-[95px] px-6 py-2">
              Entrar
            </Button>
          </div>
        </div>

        {/* Form content */}
        <div className="flex flex-col items-start self-end mt-12 mr-7 max-w-full w-[817px] max-md:mt-10 max-md:mr-2.5">
          {/* Image upload section */}
          <div className="flex flex-col justify-center items-center px-20 py-20 max-w-full text-xs font-semibold text-center bg-gray-50 rounded-xl border border-solid border-zinc-200 w-[690px] max-md:px-5">
            <Card className="flex flex-col items-center px-12 pt-24 pb-7 bg-white rounded-xl border border-solid border-zinc-200 h-[150px] w-[150px] max-md:px-5 cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center">
                <Upload className="w-6 h-6 mb-2 text-gray-600" />
                <div data-name="Carregar imagem" className="text-gray-600">
                  Carregar
                  <br />
                  imagem
                </div>
              </div>
            </Card>
          </div>

          {/* Event overview section */}
          <Card className="flex flex-col items-start px-5 py-7 mt-6 max-w-full bg-white rounded-xl border border-solid border-zinc-200 w-[690px]">
            <div
              className="text-xl font-semibold mb-5"
              data-name="Visão geral do evento"
            >
              Visão geral do evento
            </div>
            
            <div className="w-full space-y-5">
              <div>
                <div className="text-base font-semibold mb-1.5" data-name="Nome do evento">
                  Nome do evento
                </div>
                <div className="text-xs mb-5 text-gray-600" data-name="Seja claro e descritivo, com um título que diga às pessoas do que se trata seu evento.">
                  Seja claro e descritivo, com um título que diga às pessoas do que
                  se trata seu evento.
                </div>
                <Input
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="Nome do evento"
                  className="w-full"
                />
              </div>

              <div>
                <div className="text-base font-semibold mb-1.5" data-name="Subtítulo">
                  Subtítulo
                </div>
                <div className="text-xs mb-5 text-gray-600" data-name="Chame a atenção das pessoas com uma breve descrição sobre seu evento. Os participantes verão isso na parte superior da página do evento. (máximo de 140 caracteres) Ver exemplos">
                  Chame a atenção das pessoas com uma breve descrição sobre seu
                  evento. Os participantes verão isso na parte superior da página do
                  evento. (máximo de 140 caracteres) Ver exemplos
                </div>
                <Input
                  value={eventSubtitle}
                  onChange={(e) => setEventSubtitle(e.target.value)}
                  placeholder="Subtítulo"
                  maxLength={140}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          {/* Date and location section */}
          <Card className="flex flex-col items-start px-5 py-7 mt-6 max-w-full font-semibold bg-white rounded-xl border border-solid border-zinc-200 w-[690px]">
            <div className="text-xl mb-5" data-name="Data e localização">
              Data e localização
            </div>
            
            <div className="w-full space-y-5">
              <div>
                <div className="text-base mb-5" data-name="Data e hora">
                  Data e hora
                </div>
                <div className="flex gap-2.5 w-full text-xs">
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Data de início"
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      placeholder="Hora de início"
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="Data de término"
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      placeholder="Hora de término"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-base mb-3" data-name="Localização">
                  Localização
                </div>
                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100" role="tablist" aria-label="Selecionar tipo de localização">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleSetLocationType("Local")}
                    aria-pressed={locationType === "Local"}
                    className={`h-8 px-3 rounded-lg font-semibold ${
                      locationType === "Local"
                        ? "bg-white text-indigo-950 shadow-sm"
                        : "text-indigo-900 hover:text-indigo-950"
                    }`}
                  >
                    Local
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleSetLocationType("Evento online")}
                    aria-pressed={locationType === "Evento online"}
                    className={`h-8 px-3 rounded-lg font-semibold ${
                      locationType === "Evento online"
                        ? "bg-white text-indigo-950 shadow-sm"
                        : "text-indigo-900 hover:text-indigo-950"
                    }`}
                  >
                    Evento online
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleSetLocationType("Local será anunciado em breve")}
                    aria-pressed={locationType === "Local será anunciado em breve"}
                    className={`h-8 px-3 rounded-lg font-semibold ${
                      locationType === "Local será anunciado em breve"
                        ? "bg-white text-indigo-950 shadow-sm"
                        : "text-indigo-900 hover:text-indigo-950"
                    }`}
                  >
                    Local será anunciado em breve
                  </Button>
                </div>
                <div className="mt-2 text-xs text-gray-500">Tipo selecionado: {locationType}</div>

                {/* Conditional location inputs */}
                {locationType === "Local" && (
                  <div className="mt-4 space-y-3">
                    <Input
                      value={locationAddress}
                      onChange={(e) => setLocationAddress(e.target.value)}
                      placeholder="Endereço completo (rua, número, cidade, UF)"
                      className="w-full"
                    />
                    {locationAddress.trim().length > 3 && (
                      <div className="w-full h-64 rounded-md overflow-hidden border border-zinc-200">
                        <iframe
                          title="Mapa do local"
                          width="100%"
                          height="100%"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(locationAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                        />
                      </div>
                    )}
                    <div className="text-xs text-gray-600">O mapa é uma prévia baseada no endereço digitado.</div>
                  </div>
                )}

                {locationType === "Evento online" && (
                  <div className="mt-4 space-y-2">
                    <Input
                      value={onlineUrl}
                      onChange={(e) => setOnlineUrl(e.target.value)}
                      placeholder="Link da transmissão (https://...)"
                      className="w-full"
                    />
                    {(errors.url || (onlineUrl && !/^https?:\/\//i.test(onlineUrl))) && (
                      <div className="text-xs text-red-600">{errors.url || "Informe uma URL válida começando com http:// ou https://"}</div>
                    )}
                    {onlineUrl && /^https?:\/\//i.test(onlineUrl) && !errors.url && (
                      <div className="text-xs text-gray-600">Este link será exibido aos participantes após a compra/inscrição.</div>
                    )}
                  </div>
                )}

                {locationType === "Local será anunciado em breve" && (
                  <div className="mt-4 space-y-3">
                    <div className="text-sm text-gray-700">O local será anunciado em breve.</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Select value={tbdUf} onValueChange={setTbdUf}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Estado (UF)" />
                          </SelectTrigger>
                          <SelectContent>
                            {BRAZIL_UFS.map((uf) => (
                              <SelectItem key={uf} value={uf}>
                                {uf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Input
                          value={tbdCity}
                          onChange={(e) => setTbdCity(e.target.value)}
                          placeholder="Cidade"
                          className="w-full"
                        />
                      </div>
                    </div>
                    {errors.tbd ? (
                      <div className="text-xs text-red-600">{errors.tbd}</div>
                    ) : (
                      <div className="text-xs text-gray-600">
                        Defina ao menos Estado e Cidade para facilitar a indexação no site.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* About event section */}
          <Card className="flex flex-col px-5 py-7 mt-6 max-w-full bg-white rounded-xl border border-solid border-zinc-200 w-[690px]">
            <div
              className="text-xl font-semibold mb-2.5"
              data-name="Sobre este evento"
            >
              Sobre este evento
            </div>
            <div
              className="text-xs mb-4 text-gray-600"
              data-name="Use esta seção para fornecer mais detalhes sobre seu evento. Você pode incluir coisas que se deve saber, informações sobre o local, estacionamento, opções de acessibilidade – qualquer coisa que ajude as pessoas a saber o que esperar."
            >
              Use esta seção para fornecer mais detalhes sobre seu evento. Você
              pode incluir coisas que se deve saber, informações sobre o local,
              estacionamento, opções de acessibilidade – qualquer coisa que
              ajude as pessoas a saber o que esperar.
            </div>
            <Textarea
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
              className="min-h-[152px] w-full"
              placeholder="Descreva seu evento..."
            />
          </Card>

          {/* Organizer section */}
          <Card className="flex flex-col items-start px-5 py-7 mt-6 max-w-full font-semibold bg-white rounded-xl border border-solid border-zinc-200 w-[690px]">
            <div className="text-xl mb-2.5" data-name="Organizador">
              Organizador
            </div>
            <div
              className="text-xs mb-5 font-normal text-gray-600"
              data-name="Selecione aqui o seu perfil de organizador que será responsável pela realização deste evento."
            >
              Selecione aqui o seu perfil de organizador que será responsável
              pela realização deste evento.
            </div>
            
            <div className="flex flex-wrap gap-5 justify-between w-full px-6 py-4 text-sm bg-white rounded-md border border-solid border-zinc-200">
              <div className="flex gap-3 items-center">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="bg-zinc-300" />
                </Avatar>
                <div className="font-semibold" data-name="Fauves entretenimento">
                  {selectedOrganizer}
                </div>
              </div>
              <ChevronDown className="w-[13px] h-auto my-auto text-gray-600" />
            </div>
          </Card>

          {/* Save button */}
          <div className="flex justify-end mt-6 w-full">
            <Button onClick={handleSaveContinue} className="bg-indigo-700 hover:bg-indigo-800 text-white h-[45px] px-8 rounded-md font-semibold">
              Salvar e continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CriarEditarEvento;
