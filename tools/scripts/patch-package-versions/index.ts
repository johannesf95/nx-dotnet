import { WorkspaceJsonConfiguration } from '@nrwl/devkit';
import { execSync } from 'child_process';
import { existsSync, readJson, writeJson } from '../../utils';

export function PatchPackageVersions(newVersion: string) {
  const workspace: WorkspaceJsonConfiguration = readJson('workspace.json');
  const rootPkg = readJson('package.json');

  rootPkg.version = newVersion;
  writeJson('package.json', rootPkg);
  execSync(`git add package.json`, {
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  const projects = Object.values(workspace.projects);

  projects.forEach((projectConfiguration, idx) => {
    const outputPath = projectConfiguration.targets?.build?.options?.outputPath;
    const pkgPath = `${projectConfiguration.root}/package.json`;
    if (!existsSync(pkgPath)) {
        console.log('pkgPath not found', pkgPath)
      return;
    }
    const pkg = readJson(pkgPath);
    pkg.version = newVersion;

    writeJson(pkgPath, pkg);
    execSync(`git add ${pkgPath}`, {
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    execSync(
      `git commit ${
        idx > 0 ? '--amend --no-edit' : '-m "chore(): bump version"'
      }`,
      { stdio: ['ignore', 'inherit', 'inherit'] }
    );
  });

  execSync(`git tag v${newVersion}`, {
    stdio: 'inherit',
  });
}

if (require.main === module) {
    PatchPackageVersions(process.argv[2])
}
