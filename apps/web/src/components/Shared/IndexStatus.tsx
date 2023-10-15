import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { POLYGONSCAN_URL } from '@hey/data/constants';
import {
  LensTransactionStatusType,
  useLensTransactionStatusQuery
} from '@hey/lens';
import { Spinner } from '@hey/ui';
import cn from '@hey/ui/cn';
import Link from 'next/link';
import type { FC } from 'react';
import { useState } from 'react';
import type { Address } from 'viem';

interface IndexStatusProps {
  type?: string;
  txHash: Address;
  reload?: boolean;
}

const IndexStatus: FC<IndexStatusProps> = ({
  type = 'Transaction',
  txHash,
  reload = false
}) => {
  const [hide, setHide] = useState(false);
  const [pollInterval, setPollInterval] = useState(500);
  const { data, loading } = useLensTransactionStatusQuery({
    variables: { request: { forTxHash: txHash } },
    pollInterval,
    onCompleted: ({ lensTransactionStatus }) => {
      if (
        lensTransactionStatus?.status === LensTransactionStatusType.Complete
      ) {
        setPollInterval(0);
        if (reload) {
          location.reload();
        }
        setTimeout(() => {
          setHide(true);
        }, 5000);
      }
    }
  });

  return (
    <Link
      className={cn({ hidden: hide }, 'ml-auto text-sm font-medium')}
      href={`${POLYGONSCAN_URL}/tx/${txHash}`}
      target="_blank"
      rel="noreferrer noopener"
    >
      {loading ||
      !data?.lensTransactionStatus ||
      data?.lensTransactionStatus?.status ===
        LensTransactionStatusType.Processing ? (
        <div className="flex items-center space-x-1.5">
          <Spinner size="xs" />
          <div>{type} Indexing</div>
        </div>
      ) : data?.lensTransactionStatus?.status ===
        LensTransactionStatusType.Failed ? (
        <div className="flex items-center space-x-1.5">
          <XCircleIcon className="h-5 w-5 text-red-500" />
          <div>Index failed</div>
        </div>
      ) : (
        <div className="flex items-center space-x-1">
          <CheckCircleIcon className="h-5 w-5 text-green-500" />
          <div className="text-black dark:text-white">Index Successful</div>
        </div>
      )}
    </Link>
  );
};

export default IndexStatus;
