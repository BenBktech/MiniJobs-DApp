"use client"
import NotConnected from '@/components/NotConnected/NotConnected'
import { useState } from 'react'
import { Heading, Flex, Text, Textarea, Input, Button, useToast } from '@chakra-ui/react'
import { useRouter } from 'next/navigation'
import { prepareWriteContract, writeContract, waitForTransaction  } from '@wagmi/core'
import { useAccount } from 'wagmi'

import { parseEther } from 'viem'

import { contractAddress, abi } from '@/constants'

const AddAJob = () => {

    //STATES
    const [description, setDescription] = useState(null)
    const [price, setPrice] = useState(null)

    //ROUTER FOR REDIRECTION WITH NEXTJS
    const router = useRouter()

    //TOAST
    const toast = useToast()

    //ISCONNECTED
    const { isConnected } = useAccount()

    const addAJob = async() => {
        try {
            const { request } = await prepareWriteContract({
                address: contractAddress,
                abi: abi,
                functionName: "addJob",
                value: parseEther(price),
                args: [description],
            });
            const { hash } = await writeContract(request);
            const data = await waitForTransaction({
                hash: hash
            })
            toast({
                title: 'Congratulations!',
                description: "You have created a Job!",
                status: 'success',
                duration: 5000,
                isClosable: true,
            })
        }
        catch(error) {
            console.log(error)
            toast({
                title: 'Error',
                description: error.message,
                status: 'error',
                duration: 5000,
                isClosable: true,
            })
        }
        router.push('/')
    }

    return (
        <Flex direction="column" alignItems="center" justifyContent="center" w="100%" h="70vh">
            {isConnected ? (
                <>
                    <Heading as='h1' size='xl' noOfLines={1}>
                        Add a Job
                    </Heading>
                    <Flex mt="1rem" direction="column" width="100%">
                        <Text>Description :</Text>
                        <Textarea placeholder='The description of the job' onChange={e => setDescription(e.target.value)} />
                    </Flex>
                    <Flex mt="1rem" width="100%" direction="column">
                        <Text>Price :</Text>
                        <Input placeholder='How much you will pay your worker in ETH' onChange={e => setPrice(e.target.value)} />
                    </Flex>
                    <Button mt="1rem" colorScheme='whatsapp' width="100%" onClick={() => addAJob()}>Add</Button>
                </>
            ) : (
                <NotConnected />
            )}
        </Flex>
    )
}

export default AddAJob