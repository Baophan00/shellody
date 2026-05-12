// Type declaration for Petra wallet's injected browser provider.
// Petra injects window.aptos on Aptos Testnet / Mainnet / Devnet.
interface PetraWallet {
  connect(): Promise<{ address: string; publicKey: string }>;
  disconnect(): Promise<void>;
  account(): Promise<{ address: string; publicKey: string }>;
  isConnected(): Promise<boolean>;
  signMessage(payload: {
    message: string;
    nonce: string;
  }): Promise<{ signature: string; fullMessage: string }>;
  signAndSubmitTransaction(transaction: object): Promise<{ hash: string }>;
  network(): Promise<string>;
  onAccountChange(callback: (account: { address: string }) => void): void;
  onNetworkChange(callback: (network: string) => void): void;
}

interface Window {
  aptos?: PetraWallet;
}
