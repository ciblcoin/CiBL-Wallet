'use client';

export default function TransactionStatus({ status }) {
  if (!status) return null;

  const getStatusConfig = () => {
    switch (status.type) {
      case 'processing':
        return {
          bg: 'bg-blue-900/30',
          border: 'border-blue-500',
          icon: '🔄',
          title: 'Processing Transaction',
          textColor: 'text-blue-300'
        };
      case 'success':
        return {
          bg: 'bg-green-900/30',
          border: 'border-green-500',
          icon: '✅',
          title: 'Success!',
          textColor: 'text-green-300'
        };
      case 'error':
        return {
          bg: 'bg-red-900/30',
          border: 'border-red-500',
          icon: '❌',
          title: 'Error',
          textColor: 'text-red-300'
        };
      default:
        return {
          bg: 'bg-slate-800',
          border: 'border-slate-600',
          icon: 'ℹ️',
          title: 'Info',
          textColor: 'text-slate-300'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`mb-6 p-4 rounded-lg border ${config.bg} ${config.border}`}>
      <div className="flex items-start space-x-3">
        <div className="text-xl">{config.icon}</div>
        <div className="flex-1">
          <h3 className={`font-medium mb-1 ${config.textColor}`}>{config.title}</h3>
          <p className="text-sm text-slate-300 mb-2">{status.message}</p>
          
          {status.txid && (
            <div className="mt-2">
              <p className="text-xs text-slate-400 mb-1">Transaction ID:</p>
              <div className="flex items-center space-x-2">
                <code className="text-xs bg-slate-900 px-2 py-1 rounded font-mono break-all">
                  {status.txid.slice(0, 32)}...
                </code>
                <a
                  href={`https://solscan.io/tx/${status.txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  View on Solscan
                </a>
              </div>
            </div>
          )}

          {status.fee && (
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Fee Breakdown:</p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-300">Network Fee:</span>
                  <span className="text-slate-300">~$0.001</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">CiBL Service Fee:</span>
                  <span className="text-yellow-300">
                    {(status.fee.percentage * 100).toFixed(2)}%
                  </span>
                </div>
                {status.fee.feeAddress && (
                  <div className="flex justify-between">
                    <span className="text-slate-300">Fee Address:</span>
                    <span className="text-blue-300 text-xs truncate ml-2">
                      {status.fee.feeAddress.slice(0, 16)}...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {status.type === 'processing' && (
          <div className="animate-pulse">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
          </div>
        )}
      </div>

      {status.type === 'success' && (
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs text-green-400">
            ✅ Transaction confirmed. Your tokens should appear in your wallet shortly.
          </p>
        </div>
      )}
    </div>
  );
}