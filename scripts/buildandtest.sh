#!/bin/bash
# Initial Author: Bryan Gmyrek <bryangmyrekcom@gmail.com>

npm run dist && sudo dpkg -i dist/NexusWallet_2.0.0_amd64.deb && /opt/NexusWallet/nexuswallet
