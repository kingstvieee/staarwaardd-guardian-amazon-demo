import { buildGuardianPlan } from '../src/guardian-core.mjs';

// Optional server-side integration. Requires @aws-sdk/client-bedrock-runtime
// and AWS IAM credentials with bedrock:InvokeModel permission.
// Never expose AWS credentials in browser code.
export async function invokeGuardianBedrock(input) {
  if (typeof input !== 'string' || !input.trim() || input.length > 2000) throw new Error('Invalid request');
  const modelId = process.env.BEDROCK_MODEL_ID;
  const region = process.env.AWS_REGION;
  if (!modelId || !region) throw new Error('BEDROCK_NOT_CONFIGURED');
  const { BedrockRuntimeClient, ConverseCommand } = await import('@aws-sdk/client-bedrock-runtime');
  const client = new BedrockRuntimeClient({ region });
  const result = await client.send(new ConverseCommand({
    modelId,
    system: [{ text: 'You are STAARWAARDD Guardian. Return concise planning guidance only. Never claim to have sent messages, bought products, changed devices, or completed external actions. Explicit user approval is required for any external action.' }],
    messages: [{ role: 'user', content: [{ text: input }] }],
    inferenceConfig: { maxTokens: 450, temperature: 0.2 }
  }));
  const answer = (result.output?.message?.content || []).filter(x => typeof x.text === 'string').map(x => x.text).join('\n').trim();
  if (!answer) throw new Error('BEDROCK_EMPTY_RESPONSE');
  const plan = buildGuardianPlan(input);
  return {
    ok: true,
    verifiedExecution: true,
    provider: 'Amazon Bedrock',
    modelId,
    requestId: result.$metadata?.requestId || null,
    response: answer,
    approvalRequired: plan.approvalRequired,
    externalActionsExecuted: 0,
    planner: plan
  };
}
