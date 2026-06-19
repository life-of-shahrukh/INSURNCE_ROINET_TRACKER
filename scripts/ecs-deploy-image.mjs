/**
 * One-off helper: register new ECS task definition revisions with updated image tags.
 * Usage: node scripts/ecs-deploy-image.mjs <family> <container-name> <image-uri>
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [family, containerName, imageUri] = process.argv.slice(2);
if (!family || !containerName || !imageUri) {
  console.error(
    'Usage: node scripts/ecs-deploy-image.mjs <family> <container-name> <image-uri>',
  );
  process.exit(1);
}

const region = process.env.AWS_REGION ?? 'ap-south-1';

const raw = execFileSync(
  'aws',
  [
    'ecs',
    'describe-task-definition',
    '--task-definition',
    family,
    '--region',
    region,
    '--query',
    'taskDefinition',
    '--output',
    'json',
  ],
  { encoding: 'utf8' },
);

const taskDef = JSON.parse(raw);
for (const key of [
  'taskDefinitionArn',
  'revision',
  'status',
  'requiresAttributes',
  'compatibilities',
  'registeredAt',
  'registeredBy',
]) {
  delete taskDef[key];
}

const container = taskDef.containerDefinitions.find((c) => c.name === containerName);
if (!container) {
  console.error(`Container "${containerName}" not found in ${family}`);
  process.exit(1);
}
container.image = imageUri;

const tmp = join(tmpdir(), `ecs-task-${family}-${Date.now()}.json`);
writeFileSync(tmp, JSON.stringify(taskDef));

try {
  const out = execFileSync(
    'aws',
    ['ecs', 'register-task-definition', '--region', region, '--cli-input-json', `file://${tmp}`],
    { encoding: 'utf8' },
  );
  const registered = JSON.parse(out);
  const arn = registered.taskDefinition.taskDefinitionArn;
  console.log(arn);
} finally {
  unlinkSync(tmp);
}
