import React from "react";

const ChangePassword: React.FC = () => {
  const [password, setPassword] = React.useState("");
  // Simples verificador de força
  function getPasswordStrength(pw: string) {
    if (!pw) return { label: "", value: 0, color: "#e5e7eb" };
    if (pw.length < 6) return { label: "Fraca", value: 33, color: "#ef4444" };
    if (/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/.test(pw)) return { label: "Forte", value: 100, color: "#22c55e" };
    if (pw.length >= 8) return { label: "Média", value: 66, color: "#eab308" };
    return { label: "Fraca", value: 33, color: "#ef4444" };
  }
  const strength = getPasswordStrength(password);
  return (
    <>
  <h1 className="text-3xl font-bold text-[#091747] dark:text-white mb-2">A sua senha</h1>
      <hr className="my-6 border-gray-200" />
      <form className="flex flex-col gap-4">
  <label className="text-base font-bold text-[#091747] dark:text-white mb-2">Defina uma nova senha.</label>
        <input type="password" placeholder="Senha atual *" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A2AD7]" />
        <input type="password" placeholder="Nova senha *" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A2AD7]" value={password} onChange={e => setPassword(e.target.value)} />
        <input type="password" placeholder="Confirmar senha *" className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2A2AD7]" />
        <div className="flex items-center gap-2 mt-2">
          <div className="w-40 h-2 rounded bg-gray-200 overflow-hidden">
            <div style={{ width: `${strength.value}%`, background: strength.color }} className="h-2 rounded transition-all"></div>
          </div>
          <span className="text-xs text-[#091747] dark:text-white font-semibold">{strength.label}</span>
        </div>
        <button type="submit" className="bg-[#2A2AD7] text-white font-bold px-8 py-3 rounded-lg text-base shadow hover:bg-[#091747] transition-colors mt-4">Alterar senha</button>
      </form>
    </>
  );
};

export default ChangePassword;
