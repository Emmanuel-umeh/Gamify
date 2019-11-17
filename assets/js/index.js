const contractSource = `
payable contract Gamify =
      
  record game = {
    id:int,
    name: string,
    price:int,
    purchased:int,
    description : string,
    images:string,
    owner:address,
    filehash : string
    
    }


  record state = 
    {
      gameLength : int,
      games : map(int, game)
    }

  entrypoint init() = 
    { games = {}, 
      gameLength = 0}

    
  entrypoint getGameLength() : int = 
    state.gameLength

  payable stateful entrypoint addGame(name':string, price':int, images':string, description' : string, filehash' : string ) =
    let game = {id=getGameLength() + 1, name=name', price=price', description = description', images=images',purchased=0, owner=Call.caller, filehash=filehash' }
    let index = getGameLength() + 1
    put(state{games[index] = game, gameLength  = index})


  entrypoint getGame(index:int) : game = 
    switch(Map.lookup(index, state.games))
      None => abort("Game does not exist with this index")
      Some(x) => x  

  payable stateful entrypoint buyGame(_id:int)=
    let game = getGame(_id)
    
    let  owner  = game.owner : address
    
    require(game.id > 0,abort("NOT A GAME "))
    

    require(Call.value >= game.price,abort("You Don't Have Enough AE"))

    


    let updated_game = {
      id=game.id,
      name=game.name,
      price=game.price,
      images=game.images,
      description = game.description,
      purchased = game.purchased + 1, 
      owner=Call.caller,
      filehash = game.filehash}
    
    put(state{games[_id] = updated_game})
    
    
    Chain.spend(owner, Call.value)
          `;




const contractAddress = 'ct_2AtvoSEY17oVgjojn9ygadfE6JULR3JnKZzCP4Ymq8agveqnLD';
var GameArray = [];
var client = null;
var gameLength = 0;






function renderProduct() {
  GameArray = GameArray.sort(function (a, b) {
    return b.Price - a.Price
  })
  var template = $('#template').html();

  Mustache.parse(template);
  var rendered = Mustache.render(template, {
    GameArray
  });




  $('#body').html(rendered);
  console.log("Rendered")
}

async function callStatic(func, args) {

  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });

  const calledGet = await contract.call(func, args, {
    callStatic: true
  }).catch(e => console.error(e));

  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {
    contractAddress
  });
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {
    amount: value
  }).catch(e => console.error(e));

  return calledSet;
}



// test



document.addEventListener('DOMContentLoaded', async () => {

  $("#loadings").show();


  const node = await IpfsHttpClient({
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https',

  })
  console.log(node)
  window.node = node

  $("#loadings").hide();

})
var buffer = null

window.addEventListener('load', async () => {
  $("#loadings").show();

  client = await Ae.Aepp()

  gameLength = await callStatic('getGameLength', []);



  for (let i = 1; i <= gameLength; i++) {
    const games = await callStatic('getGame', [i]);

    GameArray.push({
      id: games.id,
      imageUrl: games.images,
      name: games.name,
      price: games.price,
      purchased: games.purchased,
      description: games.description,
      hash: games.filehash

    })
  }

  renderProduct();
  $("#loadings").hide();
});




const ipfs = window.IpfsHttpClient('ipfs.infura.io', '5001', { protocol: 'https' });


async function uploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const buffer = Buffer.from(reader.result)
      ipfs.add(buffer)
        .then(files => {
          resolve(files)
        })
        .catch(error => reject(error))
    }
    reader.readAsArrayBuffer(file)
  })
}




// Register Game
$('#regButton').click(async function () {
  $("#loadings").show();

  var name = ($('#name').val()),



    price = ($('#price').val());

  description = ($('#description').val());

  image = ($('#image').val());

  newfile = document.getElementById('customfiles')


  console.log(newfile)
  console.log(newfile.files[0])

  file = newfile.files[0]


  const files = await uploadFile(file)
  const multihash = files[0].hash


  console.log(multihash)





  prices = parseInt(price, 10)
  reggame = await contractCall('addGame', [name, prices, image, description, multihash], 1000)
  console.log(multihash)

  GameArray.push({
    id: GameArray.length + 1,
    name: name,
    hash: multihash,
    price: prices



  })
  location.reload((true))
  renderProduct();
  $("#loadings").hide();
});










$("#body").click(".btn", async function (event) {
  $("#loadings").show();
  console.log("Purchasing")


  dataIndex = event.target.id
  game = await callStatic('getGame', [dataIndex])


  

  await contractCall('buyGame', [dataIndex], parseInt(game.price, 10))

  

  
  




  // location.reload(true)




  renderProduct();
  console.log("@@@@@@@@@@@@@@@@@@@@@@@@ GEtting bought file")
  console.log("Copy this link and paste in a new tab to download your game : " + game.filehash)
  // var bought  = document.getElementById('link')
  // console.log(bought)
  // bought.innerHTML = "Download Link : www.ipfs.io/ipfs/"+ game.filehash;
  $("#loadings").hide();
});
      //