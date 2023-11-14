"use client"
import styles from './page.module.css'

import { Flex, Text, useToast } from '@chakra-ui/react'
import { useState, useEffect } from 'react'

import { parseAbiItem } from 'viem'

import { abi, contractAddress } from '@/constants'

// WAGMI & VIEM
import { hardhat } from 'viem/chains'
import { useAccount, usePublicClient  } from 'wagmi'
import { prepareWriteContract, writeContract, readContract, waitForTransaction } from '@wagmi/core'

import NotConnected from '@/components/NotConnected/NotConnected'
import NoJobs from '@/components/NoJobs/NoJobs'
import { Job } from '@/components/Job/Job'

export default function Home() {

  // Client Viem
  const client = usePublicClient()

  const [events, setEvents] = useState([])

  //ISCONNECTED
  const { isConnected, address } = useAccount()

  const toast = useToast()

  const getEvents = async () => {
    const getJobAddedLogs = client.getLogs({
      event: parseAbiItem('event jobAdded(address indexed author, string description, uint price, uint id, bool isFinished)'),
      fromBlock: 0n,
      toBlock: 1000n
    });
  
    const getJobTakenLogs = client.getLogs({
      event: parseAbiItem('event jobTaken(address indexed worker, uint id)'),
      fromBlock: 0n,
      toBlock: 1000n
    });
  
    const getJobIsFinishedAndPaidLogs = client.getLogs({
      event: parseAbiItem('event jobIsFinishedAndPaid(address indexed author, address indexed worker, uint id, uint pricePaid)'),
      fromBlock: 0n,
      toBlock: 1000n
    });
  
    const [jobAddedLogs, jobTakenLogs, jobIsFinishedAndPaidLogs] = await Promise.all([
      getJobAddedLogs,
      getJobTakenLogs,
      getJobIsFinishedAndPaidLogs
    ]);
  
    /*
      0:true
      1:true
      7:true
    */
    const jobTakenMap = jobTakenLogs.reduce((map, jobTaken) => {
      const id = parseInt(jobTaken.args.id);
      map[id] = true;
      return map;
    }, {});
  
    const jobFinishedMap = jobIsFinishedAndPaidLogs.reduce((map, jobFinished) => {
      const id = parseInt(jobFinished.args.id);
      map[id] = true;
      return map;
    }, {});
  
    const allTheJobs = jobAddedLogs.map((jobAdded) => {
      const id = parseInt(jobAdded.args.id);
      return {
        id: id,
        author: jobAdded.args.author,
        description: jobAdded.args.description,
        isTaken: jobTakenMap[id] || false,
        isFinished: jobFinishedMap[id] || false
      };
    });

    setEvents(allTheJobs);
  };

  //The user wants to take a job
  const takeJob = async(id) => {
    try {
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "takeJob",
        args: [Number(id)]
      });
      const { hash } = await writeContract(request);
      const data = await waitForTransaction({
        hash: hash
      })
      
      getEvents()
      toast({
        title: 'Congratulations!',
        description: "You took a job!",
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    }
    catch(error) {
      toast({
        title: 'Error',
        description: "An error occured, please try again.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  //The user wants to pay a job
  const payJob = async(id) => {
    try {
      const { request } = await prepareWriteContract({
        address: contractAddress,
        abi: abi,
        functionName: "setIsFinishedAndPay",
        args: [Number(id)]
      });
      const { hash } = await writeContract(request);
      const data = await waitForTransaction({
        hash: hash
      })
      getEvents()
      toast({
        title: 'Congratulations!',
        description: "You paid the worker!",
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    }
    catch {
      toast({
        title: 'Error',
        description: "An error occured, please try again.",
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  useEffect(() => {
    const getAllEvents = async() => {
        if(address !== 'undefined') {
          await getEvents()
        }
    }
    getAllEvents()
  }, [address])

  return (
    <Flex 
      width="100%" 
      direction={["column", "column", "row", "row"]} 
      alignItems={["center", "center", "flex-start", "flex-start"]}
      flexWrap="wrap"
    >
      {isConnected ? (
        events.length !== 0 ? (
          events.map(event => {
            return (
              <Job key={event.id} event={event} takeJob={takeJob} payJob={payJob} />
            )
          })
        ) : (
          <NoJobs />
        )
      ) : (
        <NotConnected />
      )}
      </Flex>
  )
}
