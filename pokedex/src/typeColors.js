export function getColor(type){
    if(type == "Water"){
        return "backGround-color: #4592c4; color: white;"
    }else if(type == "Grass"){
        return "backGround-color: #9bcc50; color: black;"
    }else if(type == "Poison"){
        return "backGround-color: #b97fc9; color: white;"
    }else if(type == "Fire"){
        return "backGround-color: #fd7d24; color: white;"
    }else if(type == "Bug"){
        return "backGround-color: #729f3f; color: white;"
    }else if(type == "Normal"){
        return "backGround-color: #a4acaf; color: black;"
    }else if(type == "Electric"){
        return "backGround-color: #eed535; color: black;"
    }else if(type == "Fairy"){
        return "backGround-color: #fdb9e9; color: black;"
    }else if(type == "Fighting"){
        return "backGround-color: #d56723; color: white;"
    }else if(type == "Psychic"){
        return "backGround-color: #f366b9; color: white;"
    }else if(type == "Ground"){
        return "background: linear-gradient(180deg, #f7de3f 50%, #ab9842 50%); backGround-color: #f7de3f; color: black;"
    }else if(type == "Rock"){
        return "backGround-color: #a38c21; color: white;"
    }else if(type == "Steel"){
        return "backGround-color: #9eb7b8; color: black;"
    }else if(type == "Flying"){
        return "background: linear-gradient(180deg, #3dc7ef 50%, #bdb9b8 50%); backGround-color: #3dc7ef; color: black;"
    }else if(type == "Ice"){
        return "background-color: #51c4e7; color: black;"
    }else if(type == "Ghost"){
        return "background-color: #7b62a3; color: white;"
    }else if(type == "Dragon"){
        return "background: linear-gradient(180deg, #53a4cf 50%, #f16e57 50%); backGround-color: #53a4cf; color: white;"
    }else if(type == "Dark"){
        return "backGround-color: #707070; color: white;"
    }
}