# UserFeatures
Basic smart contract ETH wallet implementing daily spend and whitelisting features.

Owner of deployed contract can access the available features:

 - Deposit ether
	 Contract allows for ether to be deposited from any address. 

 - Daily spend limit:
	 Non-whitelisted addresses must adhere to an given daily spend limit (dailySendLimit). Can be changed once EVERY      24 hours via `setDailyAllownace`. Spend limit does not affect whitelisted addresses.

 - Whitelisted Addresses:
	 Owner can whitelist a receiving address to remove the imposed daily spend limit via `whitelistAddress`.

 - Send ether to address
	 Owner can send ether within contract to a specified address. To be successful, one of the following scenarios        must be met:

	 - Whitelisted and sufficient balance.
	 - Non-whitelisted, under daily spend limit and sufficient balance.
