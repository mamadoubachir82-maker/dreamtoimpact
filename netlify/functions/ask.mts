import Anthropic from '@anthropic-ai/sdk'
import type { Config } from '@netlify/functions'

const SYSTEM_PROMPT = `Tu es l'assistant d'Africa Marché Connect (AMC), une plateforme qui relie les producteurs agricoles africains (agriculteurs, coopératives, groupements de femmes) aux acheteurs : commerçants, transformateurs, restaurants, exportateurs et familles.

Faits du projet :
- Mission : vendre plus, mieux et plus vite les récoltes locales, réduire les pertes après récolte et rendre les prix plus transparents.
- Fonctionnement : le producteur publie son offre (produit, quantité, prix, lieu) ; l'acheteur la consulte et contacte le producteur directement. AMC ne prend pas de commission sur les échanges directs.
- Produits courants : maïs, mil, sorgho, riz, arachide, niébé, manioc, igname, oignon, tomate, mangue, anacarde (cajou), karité, sésame, fonio.
- Services : place de marché, information sur les prix, conseils pratiques (séchage, stockage, conditionnement, qualité), mise en relation avec les transporteurs.
- Le site fonctionne sur téléphone, même avec une connexion faible.

Règles :
- Réponds toujours en français simple, clair et pratique, adapté à des producteurs et petits commerçants.
- Pour les questions agricoles (séchage, stockage, conservation, qualité, prix, vente), utilise ta connaissance générale et donne des étapes concrètes.
- Reste bref : 150 mots maximum. Écris en texte brut, sans Markdown (pas d'astérisques ni de #) ; pour une liste, numérote les lignes 1. 2. 3.
- N'invente jamais de chiffres officiels, de numéros de téléphone, d'adresses ou de partenaires d'AMC. Si tu ne sais pas, dis-le et propose de contacter l'équipe AMC.
- Les prix varient selon la saison et la région : donne des repères prudents, jamais des garanties.`

const anthropic = new Anthropic()

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Méthode non autorisée' }, { status: 405 })
  }

  let question = ''
  try {
    const body = await req.json()
    question = typeof body?.question === 'string' ? body.question.trim() : ''
  } catch {
    // corps invalide : traité ci-dessous
  }

  if (!question) {
    return Response.json({ error: 'Question manquante' }, { status: 400 })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-5-5',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question.slice(0, 1000) }],
    })

    const answer = message.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim()

    return Response.json({ answer })
  } catch (error) {
    console.error('ask: erreur IA', error)
    return Response.json({ error: 'Assistant indisponible' }, { status: 502 })
  }
}

export const config: Config = {
  path: '/api/ask',
}
