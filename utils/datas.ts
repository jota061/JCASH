export const inicioDoDia = (data: Date = new Date()): Date => {
    const copia = new Date(data);
    copia.setHours(0, 0, 0, 0);
    return copia;
};

export const formatarDataISO = (data: Date): string => {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
};

export const formatarDataBR = (dataISO: string): string => {
    if (!dataISO) return "";
    const [ano, mes, dia] = dataISO.split("-");
    if (!ano || !mes || !dia) return dataISO;
    return `${dia}/${mes}/${ano}`;
};

export const dataEhAnteriorAHoje = (data: Date): boolean => {
    return inicioDoDia(data).getTime() < inicioDoDia().getTime();
};

export const dataEhPosteriorAHoje = (data: Date): boolean => {
    return inicioDoDia(data).getTime() > inicioDoDia().getTime();
};

export const dataISOParaDate = (dataISO: string): Date => {
    const [ano, mes, dia] = dataISO.split("-").map(Number);
    return new Date(ano, mes - 1, dia);
};

export const adicionarDias = (data: Date, quantidade: number): Date => {
    const novaData = new Date(data);
    novaData.setDate(novaData.getDate() + quantidade);
    return novaData;
};

export const ultimoDiaDoMes = (ano: number, mes: number): number => {
    return new Date(ano, mes + 1, 0).getDate();
};

export const adicionarMeses = (data: Date, quantidade: number): Date => {
    const diaOriginal = data.getDate();
    const novaData = new Date(data);
    const mesDestino = data.getMonth() + quantidade;
    const anoDestino = novaData.getFullYear() + Math.floor(mesDestino / 12);
    const mesNormalizado = ((mesDestino % 12) + 12) % 12;
    const dia = Math.min(diaOriginal, ultimoDiaDoMes(anoDestino, mesNormalizado));

    return new Date(anoDestino, mesNormalizado, dia);
};

export const gerarDatasMensais = (dataInicio: Date, dataFim: Date): string[] => {
    const datas: string[] = [];
    let dataAtual = inicioDoDia(dataInicio);
    const limite = inicioDoDia(dataFim);

    while (dataAtual.getTime() <= limite.getTime()) {
        datas.push(formatarDataISO(dataAtual));
        dataAtual = inicioDoDia(adicionarMeses(dataInicio, datas.length));
    }

    return datas;
};
