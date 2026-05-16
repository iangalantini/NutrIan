import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { dados_do_paciente } = req.body;

  if (!dados_do_paciente) {
    return res.status(400).json({ error: 'Dados do paciente são obrigatórios' });
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_API_KEY não configurada no servidor' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Você é um nutricionista profissional.

Gere um plano alimentar semanal com base nos dados abaixo.

⚠️ Regras:
- Responda APENAS em JSON válido
- Não use markdown
- Não escreva explicações
- Respeite restrições e alergias

Dados do paciente:
${JSON.stringify(dados_do_paciente)}

Formato obrigatório:

{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["", "", "", "", ""],
        "lanche_manha": ["", "", "", "", ""],
        "almoco": ["", "", "", "", ""],
        "lanche_tarde": ["", "", "", "", ""],
        "jantar": ["", "", "", "", ""]
      }
    }
  ]
}

Regras:
- gerar 7 dias
- 5 opções por refeição
- evitar repetição
- usar alimentos comuns no Brasil`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extração robusta de JSON (procura o primeiro { e o último })
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("A IA não retornou um JSON válido.");
    }

    const jsonResponse = JSON.parse(jsonMatch[0]);

    // Validação básica da estrutura
    if (!jsonResponse.plano_semanal || !Array.isArray(jsonResponse.plano_semanal)) {
      throw new Error("Estrutura do plano inválida.");
    }

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Erro na geração do plano:", error);
    
    // Não retornar detalhes sensíveis em produção, mas aqui ajudamos o usuário no dev
    return res.status(500).json({ 
      error: 'Falha ao processar o plano alimentar.', 
      message: error.message 
    });
  }
}
