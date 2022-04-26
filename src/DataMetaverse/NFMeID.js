import React, { useContext, useEffect, useState } from 'react';
import { Box, Stack, Flex, Heading, Text, HStack } from '@chakra-ui/layout';
import { Button, Spinner, useToast } from '@chakra-ui/react';
import { ChainMetaContext } from '../libs/contexts';
import scriptjs from "scriptjs"

export default function() {
  const chainMeta = useContext(ChainMetaContext);
  const toast = useToast();
  const [nfmRendered, setNfmRendered] = useState(0);
  const [identityVerifed, setIdentityVerifed] = useState(0);
  const [identityVerifedWorking, setIdentityVerifedWorking] = useState(false);

  useEffect(async() => {
    console.log('comp loaded');
  }, []);

  function showError(errId, errMsg) {
    alert('An error occured: ' + errId + ', ' + errMsg);
  }

  function patchInitialized(patch) {
    console.log('patchInitialized', patch);
    // You can now access the patch object (patch), register variable watchers and so on
  }

  function patchFinishedLoading(patch) {
    console.log('patchFinishedLoading', patch);
      // The patch is ready now, all assets have been loaded
      //https://forum.cables.gl/t/cables-react-how-to-embed-a-patch-in-a-react-component/376/12
  }

  function initNFMeCanvas() {
    scriptjs(['libs/patch.js'], 'patch');

    scriptjs.ready('patch', () => {
      setTimeout(() => {
        setNfmRendered(1);

        window.CABLES.patch = new window.CABLES.Patch({
          patch: window.CABLES.exportedPatch,
          prefixAssetPath: '',
          glCanvasId: 'glcanvas',
          onPatchLoaded: patchInitialized,
          onFinishedLoading: patchFinishedLoading,
          onError: showError,
          "canvas": {"alpha":true, "premultipliedAlpha":true} // make canvas transparent
        });
      }, 5000);
   });
  }

  function verifyIdentity() {
    setIdentityVerifedWorking(true);

    setTimeout(() => {
      toast({
        title: "Your identity verification is complete",
        description: "You can now customize and mint your NFMe IF Avatar",
        status: "success",
        duration: 6000,
        isClosable: true,
      });

      setIdentityVerifedWorking(false);
      setIdentityVerifed(1);

      initNFMeCanvas();
    }, 5000);
  }

  return (
    <Box>
      <Stack spacing={5}>      
        <Flex align="top" spacing={10}>
          {!nfmRendered && 
          <Box maxW="sm" borderWidth="1px" p="5" m="auto" borderRadius="lg" w="100%" h="80vh" maxWidth="initial" display="flex" justifyContent="center" alignItems="center">
            {!identityVerifed && <Stack>
              <Heading size="md">Identity Verification</Heading>
              <Text fontSize="md">You need to complete an identity vetification to proceed with NFMe ID NFT avatar minting</Text>
              <Button isLoading={identityVerifedWorking} colorScheme="teal" variant="outline" onClick={() => verifyIdentity()}>Mint & Own NFT</Button>
            </Stack> || <Spinner size='xl' />}
          </Box> || 
          <Box maxW="sm" borderWidth="1px" p="5" m="auto" borderRadius="lg" w="100%" h="100vh" maxWidth="initial">
            <HStack mb="1rem">
              <Button size="sm" colorScheme="teal" variant="outline">View Identity Credential</Button>
              <Button size="sm" colorScheme="teal" variant="outline">Download NFT Image</Button>
              <Button size="sm" colorScheme="teal" variant="outline">Download NFT 3D Animation</Button>
              <Button size="sm" colorScheme="teal" variant="outline">Download 3D Rig</Button>
              <Button size="sm" colorScheme="teal" variant="outline">Mint Live NFT</Button>
              <Button size="sm" colorScheme="teal" variant="outline">Launch Avatar into Greenroom</Button>
            </HStack>

            <Box position={"absolute"}>
              <Box width="200px" position={"absolute"} bottom="0">
                <Text fontSize="md">Customize Avatar</Text>
                <Stack mt=".5rem">
                  <Button size="sm" colorScheme="teal" variant="outline">Next Helmet</Button>
                  <Button size="sm" colorScheme="teal" variant="outline">Next Colour</Button>
                </Stack>
              </Box>
              <Box w="600px" h="600px">
                <canvas id="glcanvas" width="650" height="650" style={{position:"relative", left:"256px"}}></canvas>
              </Box>
            </Box>
          </Box>}
        </Flex>
      </Stack>
    </Box>
  );
};
