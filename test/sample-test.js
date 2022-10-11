const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
var chai = require("chai");
const { expect } = require("chai");
const tokens = require("../tokens.json");

describe("Tests Metastone ERC721A", function () {
  before(async function () {
    [
      this.owner,
      this.addr1,
      this.addr2,
      this.addr3,
      this.addr4,
      ...this.addrs
    ] = await ethers.getSigners();

    let tab = [];
    tokens.map((token) => {
      tab.push(token.address);
    });
    const leaves = tab.map((address) => keccak256(address));
    this.tree = new MerkleTree(leaves, keccak256, { sort: true });
    const root = this.tree.getHexRoot();
    this.merkleTreeRoot = root;
  });

  it("should deploy the smart contract", async function () {
    this.baseURI = "ipfs://CID/";
    this.contract = await hre.ethers.getContractFactory("TestERC721A");
    this.deployedContract = await this.contract.deploy(
      this.merkleTreeRoot,
      this.baseURI
    );
  });

  it("sellingStep should equal 0 after deploying the smart contract", async function () {
    expect(await this.deployedContract.sellingStep()).to.equal(0);
  });

  it("merkleRoot should be defined and have a length of 66", async function () {
    expect(await this.deployedContract.merkleRoot()).to.have.lengthOf(66);
  });

  it("Should set the whitelist price for 1 eth", async function () {
    const eth = 1;
    await this.deployedContract.setWlSalePrice(eth);
    expect(await this.deployedContract.wlSalePrice()).to.equal(eth);
  });

  it("Should set the public price for 2 eth", async function () {
    const eth = 2;
    await this.deployedContract.setPublicSalePrice(eth);
    expect(await this.deployedContract.publicSalePrice()).to.equal(eth);
  });

  it("Should NOT change the whitelist price if not the owner", async function () {
    const eth = 1;

    await expect(
      this.deployedContract.connect(this.addr1).setPublicSalePrice(eth)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Should NOT change the public price if not the owner", async function () {
    const eth = 2;
    await expect(
      this.deployedContract.connect(this.addr1).setPublicSalePrice(eth)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should NOT change the sellingStep if NOT THE OWNER", async function () {
    await expect(
      this.deployedContract.connect(this.addr1).setStep(1)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should change the step to 1 (Whitelist Sale)", async function () {
    await this.deployedContract.setStep(1);
    expect(await this.deployedContract.sellingStep()).to.equal(1);
  });

  it("should mint one NFT on the whitelist sale if the user is whitelisted", async function () {
    const leaf = keccak256(this.addr1.address);
    const proof = this.tree.getHexProof(leaf);

    let price = await this.deployedContract.wlSalePrice();

    const overrides = {
      value: price,
    };

    await this.deployedContract
      .connect(this.addr1)
      .whitelistMint(this.addr1.address, 1, proof, overrides);
  });

  it("should NOT mint one NFT on the whitelist sale if the user is  NOT whitelisted", async function () {
    const leaf = keccak256(this.addr4.address);
    const proof = this.tree.getHexProof(leaf);

    let price = await this.deployedContract.wlSalePrice();

    const overrides = {
      value: price,
    };

    await expect(
      this.deployedContract
        .connect(this.addr3)
        .whitelistMint(this.addr3.address, 1, proof, overrides)
    ).to.be.revertedWith("Not whitelisted");
  });

  it("should get the totalSupply and the totalSupply should be equal to 1", async function () {
    expect(await this.deployedContract.totalSupply()).to.equal(1);
  });

  it("should change the step to 2 (Public sale)", async function () {
    await this.deployedContract.setStep(2);
    expect(await this.deployedContract.sellingStep()).to.equal(2);
  });

  it("should mint 3 NFTs during the public sale", async function () {
    //publicMint(address _account, uint _quantity)
    let price = await this.deployedContract.publicSalePrice();
    let finalPrice = price.mul(3);

    const overrides = {
      value: finalPrice,
    };

    await this.deployedContract
      .connect(this.addr1)
      .publicMint(this.addr1.address, 3, overrides);
  });

  it("should change the base uri", async function () {
    const uri = "ipfs://reveal/";

    await this.deployedContract.setBaseURI(uri);
    expect(await this.deployedContract.baseURI()).to.equal(uri);
  });
});
