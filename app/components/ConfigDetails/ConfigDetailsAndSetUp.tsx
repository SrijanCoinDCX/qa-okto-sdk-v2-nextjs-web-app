'use client'
import {CompactConfigDetails} from './DynamicClientDetails';

export interface Config {
  environment: string;
  clientPrivateKey: string;
  clientSWA: string;
}

interface ConfigDetailsAndSetUpProps {
  userSWA: string;
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

export interface ConfigContextType {
  config: Config;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

const ConfigDetailsAndSetUp = ({ userSWA, config, setConfig }: ConfigDetailsAndSetUpProps) => {


  return (
    <div className="relative w-full max-w-xl mx-auto p-6 overflow-hidden">
      <CompactConfigDetails config={config} userSWA={userSWA} setConfig={setConfig} />
    </div>
  );
};

export default ConfigDetailsAndSetUp;