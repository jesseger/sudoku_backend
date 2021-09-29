var currentBoard = "" //Global variable for solving and generating board
var squareCandidates =[] //Global array containing maps of candidates for solving board

function _getRowByIndex(index){
    return Math.floor(index/9);
}

function _getColByIndex(index){
    return index%9;
}

function _getBlockByIndex(index){
    var rowIndex = _getRowByIndex(index)
    var colIndex = _getColByIndex(index)
    return 3*(Math.floor(rowIndex/3)) + (Math.floor(colIndex/3));
}

function _getIndicesOfRow(rowIndex,empty=true){
    return [...Array(9).keys()].map(x => x+rowIndex*9).filter(x => (empty===false || squareCandidates[x].size>0 ))
}

function _getIndicesOfCol(colIndex,empty=true){
    return [...Array(9).keys()].map(x => colIndex+x*9).filter(x => (empty===false || squareCandidates[x].size>0 ))
}

function _getIndicesOfBlock(blockIndex,empty=true){
    return [...Array(81).keys()].filter(x => _getBlockByIndex(x)===blockIndex).filter(x => (empty===false || squareCandidates[x].size>0 ))
}

function _squaresAreInSameBlock(indices){
    var blockIndex = _getBlockByIndex(indices[0])
    for(let i=1;i<indices.length;i++){
        if(_getBlockByIndex(indices[i])!==blockIndex){
            return false;
        }
    }
    return true;
}

function _getSubsetCandidates(subsetOfIndices){
    var res= new Map();
    for(index of subsetOfIndices){
        for(candidate of squareCandidates[index].keys()){
            res.set(candidate,true)
        }
    }
    return [...res.keys()]
}

function _getPermutations(array, size) {
    function p(t, i) {
        if (t.length === size) {
            result.push(t);
            return;
        }
        if (i + 1 > array.length) {
            return;
        }
        p(t.concat(array[i]), i + 1);
        p(t, i + 1);
    }

    var result = [];
    p([], 0);
    return result;
}

function _removeSquareFromCandidates(numAtI,index,ofRow=true, ofCol=true, ofBlock=true, unchangedSquares=[]){
    var didRemoveAny = false
    //Remove from squares in same row
    if(ofRow===true){
        var rowIndex = _getRowByIndex(index);
        for(let i=rowIndex*9;i<(rowIndex+1)*9;i++){
            if(!(unchangedSquares.includes(i))){
                if(squareCandidates[i].delete(numAtI)){
                    didRemoveAny=true;
                }
            }
        }
    }
    
    //Remove from squares in same column
    if(ofCol===true){
        var colIndex = _getColByIndex(index);
        for(let i=colIndex;i<81;i+=9){
            if(!unchangedSquares.includes(i)){
                if(squareCandidates[i].delete(numAtI)){
                    didRemoveAny=true;
                }
            }
        }
    }
    //Remove from squares in same block
    if(ofBlock===true){
        var blockIndex = _getBlockByIndex(index);
        for(let i=0;i<81;i++){
            if(_getBlockByIndex(i)===blockIndex){
                if(!unchangedSquares.includes(i)){
                    if(squareCandidates[i].delete(numAtI)){
                        didRemoveAny=true;
                    }
                }
            }
        }
    }

    //Remove all candidates of newly filled square
    if(!unchangedSquares.includes(index)){
        squareCandidates[index].clear();
        didRemoveAny=true
    }
    return didRemoveAny 
}

function _insertNumber(numAtI,i,updateCandidates=true){
    currentBoard = currentBoard.substring(0,i) + String(numAtI) + currentBoard.substring(i+1);
    if(updateCandidates){
        _removeSquareFromCandidates(numAtI,i)
    }
    return true;
}

function _removeNumber(i){
    currentBoard = currentBoard.substring(0,i) + "." + currentBoard.substring(i+1);
}

function _applySolveRules(){
    var changeInLastIteration=true
    while(changeInLastIteration){
        var change = false

        //Naked Subsets.
        for (getIndicesOfHouse of [_getIndicesOfRow, _getIndicesOfCol, _getIndicesOfBlock]){
            for (houseIndex=0;houseIndex<9;houseIndex++){
                houseSquares = getIndicesOfHouse(houseIndex, true)
                for(let size=1;size<4;size++){
                    for (var subset of _getPermutations(houseSquares,size)){
                        if(subset.filter(x => squareCandidates[x].size > 0 ).length < subset.length){ //A square was inserted, so candidates of one subset-square are empty DEBUG
                            continue;
                        }
                        subsetCandidates=_getSubsetCandidates(subset)
                        if(subsetCandidates.length===subset.length){ //Naked Subset of size 1-3
                            if(size===1){ //Naked Single. 
                                _insertNumber(subsetCandidates[0],subset[0])
                                change = true
                                continue;
                            }
                            for(candidate of subsetCandidates){
                                change = (change | _removeSquareFromCandidates(candidate,subset[0],getIndicesOfHouse==_getIndicesOfRow,getIndicesOfHouse==_getIndicesOfCol,_squaresAreInSameBlock(subset),subset))
                            }
                        }
                    }
                }
            }
        }

        //Pointing Pairs/Triples (candidate appears in only 2/3 cells of a block and they are aligned in a row/col => remove from row/col outside block)
        for(blockIndex=0;blockIndex<9;blockIndex++){
            const blockSquares = _getIndicesOfBlock(houseIndex, true)
            const frequencies = [[],[],[],[],[],[],[],[],[]]
            //Set frequencies
            for(let square of houseSquares){
                for(let candidate of [...squareCandidates[square].keys()]){
                    frequencies[candidate-1].push(square)
                }
            }

            for(let num=1;num<10;num++){
                if(frequencies[num-1].length===2){
                    var inSameRow = (_getRowByIndex(frequencies[num-1][0]) === _getRowByIndex(frequencies[num-1][1]))
                    var inSameCol = (_getColByIndex(frequencies[num-1][0]) === _getColByIndex(frequencies[num-1][1]))
                    change = change | _removeSquareFromCandidates(num,frequencies[num-1][0],inSameRow,inSameCol, false,[frequencies[num-1][0],frequencies[num-1][1]])
                    
                }  
                else if(frequencies[num-1].length===3){ 
                    var inSameRow = (_getRowByIndex(frequencies[num-1][0])===_getRowByIndex(frequencies[num-1][1]) 
                    && _getRowByIndex(frequencies[num-1][0])===_getRowByIndex(frequencies[num-1][2]))
                    var inSameCol = (_getColByIndex(frequencies[num-1][0])===_getColByIndex(frequencies[num-1][1]) 
                    && _getColByIndex(frequencies[num-1][0])===_getColByIndex(frequencies[num-1][2]))
                    change = change | _removeSquareFromCandidates(num,frequencies[num-1][0],inSameRow,inSameCol, false,[frequencies[num-1][0],frequencies[num-1][1],frequencies[num-1][2]])
                }
            }
        }

        //Hidden singles and pairs
        for (getIndicesOfHouse of [_getIndicesOfRow, _getIndicesOfCol, _getIndicesOfBlock]){
            for (houseIndex=0;houseIndex<9;houseIndex++){
                const houseSquares = getIndicesOfHouse(houseIndex, true)
                const frequencies = [[],[],[],[],[],[],[],[],[]]
                //Set frequencies
                for(let square of houseSquares){
                    for(let candidate of [...squareCandidates[square].keys()]){
                        frequencies[candidate-1].push(square)
                    }
                }

                for(let num=1;num<10;num++){
                    //Hidden single
                    if(frequencies[num-1].length===1){
                        _insertNumber(num, frequencies[num-1][0])
                        change = true
                    }
                    //Hidden pair
                    else if(frequencies[num-1].length===2){
                        for(let potPartner=num+1;potPartner<10;potPartner++){
                            if(frequencies[num-1].length === frequencies[potPartner-1].length && frequencies[num-1].every((v, i) => v === frequencies[potPartner-1][i])){ 
                                //num and potPartner are hidden pair
                                if(squareCandidates[frequencies[num-1][0]].size >2 || squareCandidates[frequencies[num-1][1]].size >2){
                                    squareCandidates[frequencies[num-1][0]].clear()
                                    squareCandidates[frequencies[num-1][0]].set(num,true)
                                    squareCandidates[frequencies[num-1][0]].set(potPartner, true)
                                    squareCandidates[frequencies[num-1][1]].clear()
                                    squareCandidates[frequencies[num-1][1]].set(num,true)
                                    squareCandidates[frequencies[num-1][1]].set(potPartner, true)
                                    change = true
                                }
                            }
                        }
                    }
                }

            }
        }

        //Claiming Pairs/Triples (candidate only appears in 2/3 squares in a row/col, which are also in the same block => remove from rest of block)
        for (getIndicesOfHouse of [_getIndicesOfRow, _getIndicesOfCol]){
            for(houseIndex=0;houseIndex<9;houseIndex++){
                const houseSquares = getIndicesOfHouse(houseIndex, true)
                const frequencies = [[],[],[],[],[],[],[],[],[]]
                //Set frequencies
                for(let square of houseSquares){
                    for(let candidate of [...squareCandidates[square].keys()]){
                        frequencies[candidate-1].push(square)
                    }
                }
    
                for(let num=1;num<10;num++){
                    if(frequencies[num-1].length===2){
                        var potClaimingPair = [frequencies[num-1][0],frequencies[num-1][1]]
                        change = change | _removeSquareFromCandidates(num,frequencies[num-1][0],false,false,_squaresAreInSameBlock(potClaimingPair),potClaimingPair)
                    }  
                    else if(frequencies[num-1].length===3){ 
                        var potClaimingTriple = [frequencies[num-1][0],frequencies[num-1][1],frequencies[num-1][2]]
                        change = change | _removeSquareFromCandidates(num,frequencies[num-1][0],false,false,_squaresAreInSameBlock(potClaimingTriple),potClaimingTriple)
                    }
                }
            }
        }
        changeInLastIteration = change;
    }
}

function _getShuffledSequence(sequence){
    shuffled = [...Array(sequence.length).keys()].map(x => null)
    for(let i of sequence){
        randomIdx=Math.floor(Math.random()*(sequence.length-1))
        while(shuffled[randomIdx]!==null){
            randomIdx = (randomIdx+1) % sequence.length
        }
        shuffled[randomIdx]= i
    }
    return shuffled
}

function _solve(index, reversed){
    if(index===currentBoard.length){ //Board is completely filled
        return true;
    }
    else if(currentBoard.charAt(index)!=="."){ //Square is already filled
        return _solve(index+1);
    }
    else{ //Attempt to fill square and continue
        let candidates = [...squareCandidates[index].keys()]
        if(reversed){candidates.reverse()} 
        var boardBefore=currentBoard //SPEEDUP
        var candidatesBefore=[...squareCandidates]
        for (let num of candidates){
            var storedIndices = []
            for (let sharingSquare of _getIndicesOfRow(_getRowByIndex(index)).concat(_getIndicesOfCol(_getColByIndex(index))).concat(_getIndicesOfBlock(_getBlockByIndex(index)))){
                if(squareCandidates[sharingSquare].has(num)){
                    storedIndices.push(sharingSquare)
                }
            }

            _insertNumber(num, index, true)
            _applySolveRules()

            leadsToSolution = _solve(index+1, reversed)
            if(leadsToSolution){
                return true;
            }
            else{
                currentBoard = boardBefore
                squareCandidates = [...candidatesBefore]
            }
        }
        return false;
    }
}

function solveBoard(inputBoard, reversed=false){
    currentBoard = inputBoard

    //create Map for candidates of every square
    for (let i=0;i<81;i++){ 
        map = new Map([[1,true],[2,true],[3,true],[4,true],[5,true],[6,true],[7,true],[8,true],[9,true]])
        squareCandidates[i] = map
    }
    
    //Update candidates according to initial board
    for(let i=0;i<81;i++){
        charAtI = currentBoard.charAt(i)
        if(charAtI!=="."){
            _removeSquareFromCandidates(parseInt(charAtI),i)
        }
    }

    //Apply rules as far as possible
    _applySolveRules()

    //solve is a backtracking algorithm that uses applySolveRules()
    if(_solve(0, reversed)){
        return true
    }
    else{
        return false
    }
}

function generateBoard(coverage){
    //Force range 17-81
    var difficulty;
    if(typeof(coverage)!=="number"){
        difficulty = 61
    }
    else if(coverage<17){
        difficulty=17
    }
    else if(coverage>81){
        difficulty=81
    }
    else{
        difficulty = Math.floor(coverage)
    }

    var generatedBoard =""
    for(let i=0;i<81;i++){
        generatedBoard+="."
    }

    const tempCandidates = [] //Different array of candidates maps, because squareCandidates is altered in solveBoard

    for (let i=0;i<81;i++){ 
        map = new Map([[1,true],[2,true],[3,true],[4,true],[5,true],[6,true],[7,true],[8,true],[9,true]])
        tempCandidates[i] = map
    }

    var shuffledIndices = _getShuffledSequence([...Array(81).keys()])
    
    for(let i=0; i<difficulty; i++){
        currentBoard=generatedBoard
        var index = shuffledIndices[i]
        var candidates = [...tempCandidates[index].keys()]
        var shuffledCandidates = _getShuffledSequence(candidates)
        for(let cand of shuffledCandidates){
            currentBoard= generatedBoard.substring(0,index) + String(cand) + generatedBoard.substring(index+1)
            if(solveBoard(currentBoard)){
                generatedBoard = generatedBoard.substring(0,index) + String(cand) + generatedBoard.substring(index+1)
                for(let sharingSquare of [...new Set(_getIndicesOfRow(_getRowByIndex(index), false).concat(_getIndicesOfCol(_getColByIndex(index), false)).concat(_getIndicesOfBlock(_getBlockByIndex(index),false)))]){
                    tempCandidates[sharingSquare].delete(cand)
                }
                tempCandidates[index].clear()
                break;
            }
        }
    }
    var firstSolution = currentBoard
    solveBoard(generatedBoard, true)
    var secondSolution = currentBoard
    var addedNumbers = 0
    while(firstSolution!==secondSolution){
        addedNumbers+=1
        for(let i=0;i<81;i++){
            if(firstSolution[i]!==secondSolution[i]){
                generatedBoard = generatedBoard.substring(0,i)+firstSolution[i]+generatedBoard.substring(i+1)
            }
            solveBoard(generatedBoard, false)
            firstSolution=currentBoard
            solveBoard(generatedBoard, true)
            secondSolution=currentBoard
            break;
        }
    }
    return [generatedBoard,currentBoard] //returns board and solution
}

exports.generateBoard = generateBoard